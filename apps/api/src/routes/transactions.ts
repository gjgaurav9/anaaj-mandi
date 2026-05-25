import type { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { LotModel, TransactionModel, type TransactionDoc } from '@anaaj/db';
import { CreateTransactionInputSchema } from '@anaaj/types';
import { parseOrThrow } from '../lib/zod.js';
import { fail, ok } from '../lib/reply.js';

function serialize(t: TransactionDoc) {
  return {
    _id: String(t._id),
    lot_id: String(t.lot_id),
    buyer_id: String(t.buyer_id),
    seller_id: String(t.seller_id),
    broker_id: t.broker_id ? String(t.broker_id) : null,
    quantity_quintals: t.quantity_quintals,
    price_per_quintal: t.price_per_quintal,
    total_amount: t.total_amount,
    status: t.status,
    platform_fee: t.platform_fee,
    recorded_by: String(t.recorded_by),
    recorded_at: t.recorded_at,
  };
}

export default async function transactionsRoutes(app: FastifyInstance) {
  app.post('/transactions', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = parseOrThrow(CreateTransactionInputSchema, req.body);
    if (!Types.ObjectId.isValid(body.lot_id)) {
      return fail(reply, 400, 'invalid_id', 'invalid lot id');
    }
    const lot = await LotModel.findById(body.lot_id);
    if (!lot) return fail(reply, 404, 'lot_not_found', 'lot not found');

    const recorderId = new Types.ObjectId(req.user.sub);
    const isParty =
      String(body.buyer_id) === req.user.sub ||
      String(body.seller_id) === req.user.sub ||
      (body.broker_id && String(body.broker_id) === req.user.sub) ||
      req.user.role === 'admin';
    if (!isParty) {
      return fail(reply, 403, 'forbidden', 'only a party (or admin) can record this txn');
    }

    const total = Math.round(body.quantity_quintals * body.price_per_quintal);
    const txn = await TransactionModel.create({
      lot_id: lot._id,
      buyer_id: new Types.ObjectId(body.buyer_id),
      seller_id: new Types.ObjectId(body.seller_id),
      broker_id: body.broker_id ? new Types.ObjectId(body.broker_id) : undefined,
      quantity_quintals: body.quantity_quintals,
      price_per_quintal: body.price_per_quintal,
      total_amount: total,
      status: body.status ?? 'agreed',
      recorded_by: recorderId,
    });

    // Mark lot as sold (or reserved depending on status)
    if (txn.status === 'delivered' || txn.status === 'shipped') {
      lot.status = 'sold';
      await lot.save();
    } else if (txn.status === 'agreed') {
      lot.status = 'reserved';
      await lot.save();
    }

    return ok(reply, { transaction: serialize(txn) }, 201);
  });

  app.get('/transactions/mine', { preHandler: [app.authenticate] }, async (req, reply) => {
    const uid = new Types.ObjectId(req.user.sub);
    const items = await TransactionModel.find({
      $or: [{ buyer_id: uid }, { seller_id: uid }, { broker_id: uid }, { recorded_by: uid }],
    })
      .sort({ recorded_at: -1 })
      .limit(100);
    return ok(reply, { items: items.map(serialize) });
  });
}
