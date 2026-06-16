import type { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { SupportTicketModel, type SupportTicketDoc } from '@anaaj/db';
import { CreateTicketInputSchema } from '@anaaj/types';
import { parseOrThrow } from '../lib/zod.js';
import { ok } from '../lib/reply.js';

function serializeTicket(t: SupportTicketDoc) {
  return {
    _id: String(t._id),
    role: t.role,
    category: t.category,
    message: t.message,
    related_lot_id: t.related_lot_id ? String(t.related_lot_id) : null,
    related_broker_id: t.related_broker_id ? String(t.related_broker_id) : null,
    status: t.status,
    admin_note: t.admin_note ?? null,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

export default async function supportRoutes(app: FastifyInstance) {
  // --- file a report / support ticket (any authed user) ---
  app.post('/support/tickets', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = parseOrThrow(CreateTicketInputSchema, req.body);
    const ticket = await SupportTicketModel.create({
      user_id: new Types.ObjectId(req.user.sub),
      role: req.user.role,
      category: body.category,
      message: body.message,
      ...(body.related_lot_id ? { related_lot_id: new Types.ObjectId(body.related_lot_id) } : {}),
      ...(body.related_broker_id
        ? { related_broker_id: new Types.ObjectId(body.related_broker_id) }
        : {}),
    });
    return ok(reply, { ticket: serializeTicket(ticket) }, 201);
  });

  // --- the reporter's own tickets ---
  app.get('/support/tickets/mine', { preHandler: [app.authenticate] }, async (req, reply) => {
    const docs = await SupportTicketModel.find({ user_id: new Types.ObjectId(req.user.sub) })
      .sort({ created_at: -1 })
      .limit(50);
    return ok(reply, { items: docs.map(serializeTicket) });
  });
}
