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
    broker_id: String(t.broker_id),
    seller_name: t.seller_name,
    seller_phone: t.seller_phone,
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
    if (!Types.ObjectId.isValid(body.lot_id) || !Types.ObjectId.isValid(body.buyer_id)) {
      return fail(reply, 400, 'invalid_id', 'invalid id in body');
    }
    const lot = await LotModel.findById(body.lot_id);
    if (!lot) return fail(reply, 404, 'lot_not_found', 'lot not found');

    // Only the broker who listed the lot (or the buyer named) can record.
    const recorderId = req.user.sub;
    const isParty =
      String(lot.broker_id) === recorderId ||
      String(body.buyer_id) === recorderId ||
      req.user.role === 'admin';
    if (!isParty) {
      return fail(reply, 403, 'forbidden', 'only the broker, buyer or admin can record this txn');
    }

    const total = Math.round(body.quantity_quintals * body.price_per_quintal);
    const txn = await TransactionModel.create({
      lot_id: lot._id,
      buyer_id: new Types.ObjectId(body.buyer_id),
      broker_id: lot.broker_id,
      seller_name: lot.seller.name,
      seller_phone: lot.seller.phone,
      quantity_quintals: body.quantity_quintals,
      price_per_quintal: body.price_per_quintal,
      total_amount: total,
      status: body.status ?? 'agreed',
      recorded_by: new Types.ObjectId(recorderId),
    });

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
      $or: [{ buyer_id: uid }, { broker_id: uid }, { recorded_by: uid }],
    })
      .sort({ recorded_at: -1 })
      .limit(100);
    return ok(reply, { items: items.map(serialize) });
  });
}
