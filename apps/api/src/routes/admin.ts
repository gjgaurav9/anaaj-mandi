import type { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { LotModel, UserModel, PriceTickModel, SupportTicketModel } from '@anaaj/db';
import {
  AdminKycDecisionInputSchema,
  CreatePriceTickInputSchema,
  UpdateTicketInputSchema,
} from '@anaaj/types';
import { parseOrThrow } from '../lib/zod.js';
import { fail, ok } from '../lib/reply.js';

export default async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireRole('admin'));

  // --- KYC queue ---
  app.get('/admin/kyc/pending', async (_req, reply) => {
    const users = await UserModel.find({ 'kyc.status': 'pending' })
      .sort({ created_at: -1 })
      .limit(100)
      .select('phone name role kyc business_name created_at');
    return ok(reply, {
      items: users.map((u) => ({
        _id: String(u._id),
        phone: u.phone,
        name: u.name ?? null,
        role: u.role,
        business_name: u.business_name ?? null,
        kyc: u.kyc,
        created_at: u.created_at,
      })),
    });
  });

  app.post<{ Params: { userId: string } }>('/admin/kyc/:userId', async (req, reply) => {
    if (!Types.ObjectId.isValid(req.params.userId)) {
      return fail(reply, 400, 'invalid_id', 'invalid user id');
    }
    const body = parseOrThrow(AdminKycDecisionInputSchema, req.body);
    const user = await UserModel.findById(req.params.userId);
    if (!user) return fail(reply, 404, 'not_found', 'user not found');
    user.kyc = {
      ...(user.kyc ?? { status: 'pending' }),
      status: body.status,
      verified_at: body.status === 'verified' ? new Date() : user.kyc?.verified_at,
      ...(body.reason ? { reason: body.reason } : {}),
    };
    await user.save();
    return ok(reply, {
      user: {
        _id: String(user._id),
        phone: user.phone,
        kyc: user.kyc,
      },
    });
  });

  // --- lot moderation ---
  app.get('/admin/lots', async (req, reply) => {
    const status = (req.query as { status?: string } | undefined)?.status;
    const filter = status ? { status } : {};
    const items = await LotModel.find(filter).sort({ created_at: -1 }).limit(100);
    return ok(reply, {
      items: items.map((l) => ({
        _id: String(l._id),
        broker_id: String(l.broker_id),
        seller: { name: l.seller.name, phone: l.seller.phone, village: l.seller.village ?? null },
        variety: l.variety,
        quantity_quintals: l.quantity_quintals,
        price_per_quintal: l.price_per_quintal,
        status: l.status,
        photos: l.photos,
        pickup_location: l.pickup_location,
        created_at: l.created_at,
      })),
    });
  });

  // --- price tick entry ---
  app.post('/admin/prices', async (req, reply) => {
    const body = parseOrThrow(CreatePriceTickInputSchema, req.body);
    const date =
      body.date ??
      (() => {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        return d;
      })();
    const tick = await PriceTickModel.findOneAndUpdate(
      { mandi: body.mandi, variety: body.variety, date },
      {
        grain: body.grain,
        mandi: body.mandi,
        variety: body.variety,
        price_min: body.price_min,
        price_max: body.price_max,
        price_modal: body.price_modal,
        source: 'manual',
        date,
      },
      { upsert: true, new: true },
    );
    await app.redis.del(`prices:today:${date.toISOString().slice(0, 10)}`);
    return ok(reply, {
      tick: {
        _id: String(tick._id),
        mandi: tick.mandi,
        variety: tick.variety,
        price_min: tick.price_min,
        price_modal: tick.price_modal,
        price_max: tick.price_max,
        date: tick.date,
      },
    });
  });

  // --- support tickets ---
  app.get('/admin/support', async (req, reply) => {
    const status = (req.query as { status?: string } | undefined)?.status;
    const filter = status ? { status } : {};
    const items = await SupportTicketModel.find(filter).sort({ created_at: -1 }).limit(200);
    return ok(reply, {
      items: items.map((t) => ({
        _id: String(t._id),
        user_id: String(t.user_id),
        role: t.role,
        category: t.category,
        message: t.message,
        related_lot_id: t.related_lot_id ? String(t.related_lot_id) : null,
        related_broker_id: t.related_broker_id ? String(t.related_broker_id) : null,
        status: t.status,
        admin_note: t.admin_note ?? null,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })),
    });
  });

  app.patch<{ Params: { id: string } }>('/admin/support/:id', async (req, reply) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return fail(reply, 400, 'invalid_id', 'invalid ticket id');
    }
    const body = parseOrThrow(UpdateTicketInputSchema, req.body);
    const ticket = await SupportTicketModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status: body.status, ...(body.admin_note ? { admin_note: body.admin_note } : {}) },
      },
      { new: true },
    );
    if (!ticket) return fail(reply, 404, 'not_found', 'ticket not found');
    return ok(reply, {
      ticket: {
        _id: String(ticket._id),
        status: ticket.status,
        admin_note: ticket.admin_note ?? null,
      },
    });
  });
}
