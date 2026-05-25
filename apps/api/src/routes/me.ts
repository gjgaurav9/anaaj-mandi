import type { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { UserModel, type UserDoc } from '@anaaj/db';
import { UpdateMeInputSchema } from '@anaaj/types';
import { parseOrThrow } from '../lib/zod.js';
import { fail, ok } from '../lib/reply.js';

function serializeUser(u: UserDoc) {
  return {
    _id: String(u._id),
    phone: u.phone,
    name: u.name ?? null,
    role: u.role,
    kyc: u.kyc ?? { status: 'pending' },
    location: u.location ?? null,
    business_name: u.business_name ?? null,
    broker_mandi: u.broker_mandi ?? null,
    broker_years: u.broker_years ?? null,
    buyer_company: u.buyer_company ?? null,
    buyer_gst: u.buyer_gst ?? null,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}

export default async function meRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!Types.ObjectId.isValid(req.user.sub)) {
      return fail(reply, 400, 'invalid_token', 'session subject is not a valid id');
    }
    const user = await UserModel.findById(req.user.sub);
    if (!user) return fail(reply, 401, 'unauthenticated', 'user no longer exists');
    return ok(reply, { user: serializeUser(user) });
  });

  app.patch('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const update = parseOrThrow(UpdateMeInputSchema, req.body);
    const user = await UserModel.findByIdAndUpdate(req.user.sub, { $set: update }, { new: true });
    if (!user) return fail(reply, 404, 'not_found', 'user not found');
    return ok(reply, { user: serializeUser(user) });
  });
}
