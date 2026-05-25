import type { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { InquiryModel, LotModel, type InquiryDoc } from '@anaaj/db';
import { CreateInquiryInputSchema, UpdateInquiryStatusInputSchema } from '@anaaj/types';
import { parseOrThrow } from '../lib/zod.js';
import { fail, ok } from '../lib/reply.js';

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

function serialize(i: InquiryDoc) {
  return {
    _id: String(i._id),
    lot_id: String(i.lot_id),
    buyer_id: String(i.buyer_id),
    seller_id: String(i.seller_id),
    message: i.message,
    status: i.status,
    channel: i.channel,
    created_at: i.created_at,
  };
}

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

    // 24h dedupe
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
      seller_id: lot.seller_id,
      message: body.message,
      channel: body.channel,
    });
    // Increment lot.inquiry_count fire-and-forget
    LotModel.updateOne({ _id: lot._id }, { $inc: { inquiry_count: 1 } }).catch((err) =>
      app.log.warn({ err }, 'inquiry_count increment failed'),
    );
    return ok(reply, { inquiry: serialize(inquiry) }, 201);
  });

  // --- buyer's outgoing ---
  app.get('/inquiries/sent', { preHandler: [app.requireRole('buyer')] }, async (req, reply) => {
    const buyerId = new Types.ObjectId(req.user.sub);
    const items = await InquiryModel.find({ buyer_id: buyerId })
      .sort({ created_at: -1 })
      .limit(100);
    return ok(reply, { items: items.map(serialize) });
  });

  // --- seller's incoming ---
  app.get(
    '/inquiries/received',
    { preHandler: [app.requireRole('seller', 'broker')] },
    async (req, reply) => {
      const sellerId = new Types.ObjectId(req.user.sub);
      const items = await InquiryModel.find({ seller_id: sellerId })
        .sort({ created_at: -1 })
        .limit(100);
      return ok(reply, { items: items.map(serialize) });
    },
  );

  // --- status update ---
  app.patch<{ Params: { id: string } }>(
    '/inquiries/:id/status',
    { preHandler: [app.requireRole('seller', 'broker')] },
    async (req, reply) => {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return fail(reply, 400, 'invalid_id', 'invalid inquiry id');
      }
      const body = parseOrThrow(UpdateInquiryStatusInputSchema, req.body);
      const inquiry = await InquiryModel.findById(req.params.id);
      if (!inquiry) return fail(reply, 404, 'not_found', 'inquiry not found');
      if (String(inquiry.seller_id) !== req.user.sub) {
        return fail(reply, 403, 'forbidden', 'not your inquiry');
      }
      inquiry.status = body.status;
      await inquiry.save();
      return ok(reply, { inquiry: serialize(inquiry) });
    },
  );
}
