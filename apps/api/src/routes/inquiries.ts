import type { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { InquiryModel, LotModel, type InquiryDoc } from '@anaaj/db';
import { CreateInquiryInputSchema, UpdateInquiryStatusInputSchema } from '@anaaj/types';
import { parseOrThrow } from '../lib/zod.js';
import { fail, ok } from '../lib/reply.js';

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

interface PopulatedLot {
  _id: Types.ObjectId;
  variety: string;
  quantity_quintals: number;
  price_per_quintal: number;
  pickup_location?: { city?: string };
}

interface PopulatedUser {
  _id: Types.ObjectId;
  name?: string;
  phone?: string;
  broker_mandi?: string;
  buyer_company?: string;
}

type PopulatedInquiry = Omit<InquiryDoc, 'lot_id' | 'buyer_id' | 'broker_id'> & {
  lot_id: PopulatedLot | Types.ObjectId;
  buyer_id: PopulatedUser | Types.ObjectId;
  broker_id: PopulatedUser | Types.ObjectId;
};

function lotSummary(field: PopulatedLot | Types.ObjectId | undefined) {
  if (!field || field instanceof Types.ObjectId) return null;
  return {
    _id: String(field._id),
    variety: field.variety,
    quantity_quintals: field.quantity_quintals,
    price_per_quintal: field.price_per_quintal,
    city: field.pickup_location?.city ?? null,
  };
}

function userSummary(
  field: PopulatedUser | Types.ObjectId | undefined,
  opts: { revealPhone?: boolean } = {},
) {
  if (!field || field instanceof Types.ObjectId) return null;
  return {
    _id: String(field._id),
    name: field.name ?? null,
    phone: opts.revealPhone ? (field.phone ?? null) : null,
    broker_mandi: field.broker_mandi ?? null,
    buyer_company: field.buyer_company ?? null,
  };
}

function serializeForBroker(i: PopulatedInquiry) {
  return {
    _id: String(i._id),
    status: i.status,
    channel: i.channel,
    message: i.message,
    created_at: i.created_at,
    lot: lotSummary(i.lot_id),
    counterparty: userSummary(i.buyer_id, { revealPhone: true }),
  };
}

function serializeForBuyer(i: PopulatedInquiry) {
  return {
    _id: String(i._id),
    status: i.status,
    channel: i.channel,
    message: i.message,
    created_at: i.created_at,
    lot: lotSummary(i.lot_id),
    counterparty: userSummary(i.broker_id, { revealPhone: true }),
  };
}

const LOT_FIELDS = '_id variety quantity_quintals price_per_quintal pickup_location.city';
const USER_FIELDS = '_id name phone broker_mandi buyer_company';

export default async function inquiriesRoutes(app: FastifyInstance) {
  // --- create ---
  app.post('/inquiries', { preHandler: [app.requireRole('buyer')] }, async (req, reply) => {
    const body = parseOrThrow(CreateInquiryInputSchema, req.body);
    if (!Types.ObjectId.isValid(body.lot_id)) {
      return fail(reply, 400, 'invalid_id', 'invalid lot id');
    }
    const lot = await LotModel.findById(body.lot_id);
    if (!lot) return fail(reply, 404, 'not_found', 'lot not found');

    const buyerId = new Types.ObjectId(req.user.sub);

    const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
    const existing = await InquiryModel.findOne({
      buyer_id: buyerId,
      lot_id: lot._id,
      created_at: { $gte: since },
    }).sort({ created_at: -1 });
    if (existing) {
      return fail(
        reply,
        429,
        'inquiry_dedupe',
        'you already inquired about this lot within the last 24 hours',
      );
    }

    const inquiry = await InquiryModel.create({
      lot_id: lot._id,
      buyer_id: buyerId,
      broker_id: lot.broker_id,
      message: body.message,
      channel: body.channel,
    });
    LotModel.updateOne({ _id: lot._id }, { $inc: { inquiry_count: 1 } }).catch((err) =>
      app.log.warn({ err }, 'inquiry_count increment failed'),
    );
    return ok(
      reply,
      {
        inquiry: {
          _id: String(inquiry._id),
          status: inquiry.status,
          channel: inquiry.channel,
          created_at: inquiry.created_at,
        },
      },
      201,
    );
  });

  // --- buyer's outgoing ---
  app.get('/inquiries/sent', { preHandler: [app.requireRole('buyer')] }, async (req, reply) => {
    const buyerId = new Types.ObjectId(req.user.sub);
    const docs = await InquiryModel.find({ buyer_id: buyerId })
      .populate({ path: 'lot_id', select: LOT_FIELDS })
      .populate({ path: 'broker_id', select: USER_FIELDS })
      .sort({ created_at: -1 })
      .limit(100);
    return ok(reply, {
      items: docs.map((d) => serializeForBuyer(d as unknown as PopulatedInquiry)),
    });
  });

  // --- broker's incoming ---
  app.get(
    '/inquiries/received',
    { preHandler: [app.requireRole('broker')] },
    async (req, reply) => {
      const brokerId = new Types.ObjectId(req.user.sub);
      const docs = await InquiryModel.find({ broker_id: brokerId })
        .populate({ path: 'lot_id', select: LOT_FIELDS })
        .populate({ path: 'buyer_id', select: USER_FIELDS })
        .sort({ created_at: -1 })
        .limit(100);
      return ok(reply, {
        items: docs.map((d) => serializeForBroker(d as unknown as PopulatedInquiry)),
      });
    },
  );

  // --- status update (broker side) ---
  app.patch<{ Params: { id: string } }>(
    '/inquiries/:id/status',
    { preHandler: [app.requireRole('broker')] },
    async (req, reply) => {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return fail(reply, 400, 'invalid_id', 'invalid inquiry id');
      }
      const body = parseOrThrow(UpdateInquiryStatusInputSchema, req.body);
      const inquiry = await InquiryModel.findById(req.params.id);
      if (!inquiry) return fail(reply, 404, 'not_found', 'inquiry not found');
      if (String(inquiry.broker_id) !== req.user.sub) {
        return fail(reply, 403, 'forbidden', 'not your inquiry');
      }
      inquiry.status = body.status;
      await inquiry.save();
      return ok(reply, {
        inquiry: { _id: String(inquiry._id), status: inquiry.status, channel: inquiry.channel },
      });
    },
  );
}
