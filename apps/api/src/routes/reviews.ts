import type { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { ReviewModel, UserModel, type ReviewDoc } from '@anaaj/db';
import { CreateReviewInputSchema } from '@anaaj/types';
import { parseOrThrow } from '../lib/zod.js';
import { fail, ok } from '../lib/reply.js';

interface ReviewBuyer {
  _id: Types.ObjectId;
  name?: string;
}

type PopulatedReview = Omit<ReviewDoc, 'buyer_id'> & {
  buyer_id: ReviewBuyer | Types.ObjectId;
};

function serializeReview(r: PopulatedReview) {
  const buyer =
    r.buyer_id && !(r.buyer_id instanceof Types.ObjectId)
      ? { _id: String(r.buyer_id._id), name: r.buyer_id.name ?? null }
      : { _id: String(r.buyer_id), name: null };
  return {
    _id: String(r._id),
    broker_id: String(r.broker_id),
    buyer,
    lot_id: r.lot_id ? String(r.lot_id) : null,
    scores: r.scores,
    overall: r.overall,
    comment: r.comment,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/** Recompute and persist the broker's rating aggregate from all their reviews. */
async function recomputeBrokerRating(brokerId: Types.ObjectId): Promise<void> {
  const agg = await ReviewModel.aggregate<{ avg: number; count: number }>([
    { $match: { broker_id: brokerId } },
    { $group: { _id: null, avg: { $avg: '$overall' }, count: { $sum: 1 } } },
  ]);
  const avg = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
  const count = agg[0]?.count ?? 0;
  await UserModel.updateOne({ _id: brokerId }, { $set: { rating: { avg, count } } });
}

export default async function reviewsRoutes(app: FastifyInstance) {
  // --- create / update a review (buyer) ---
  app.post('/reviews', { preHandler: [app.requireRole('buyer')] }, async (req, reply) => {
    const body = parseOrThrow(CreateReviewInputSchema, req.body);
    const brokerId = new Types.ObjectId(body.broker_id);
    const buyerId = new Types.ObjectId(req.user.sub);

    const broker = await UserModel.findById(brokerId).select('role');
    if (!broker || broker.role !== 'broker') {
      return fail(reply, 404, 'not_found', 'broker not found');
    }

    const s = body.scores;
    const overall =
      Math.round(((s.payment_on_time + s.quality_match + s.delivery + s.ease_of_deal) / 4) * 10) /
      10;

    const review = await ReviewModel.findOneAndUpdate(
      { broker_id: brokerId, buyer_id: buyerId },
      {
        broker_id: brokerId,
        buyer_id: buyerId,
        ...(body.lot_id ? { lot_id: new Types.ObjectId(body.lot_id) } : {}),
        scores: s,
        overall,
        comment: body.comment,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await recomputeBrokerRating(brokerId);
    return ok(reply, { review: serializeReview(review as unknown as PopulatedReview) }, 201);
  });

  // --- list a broker's reviews (public) ---
  app.get<{ Params: { brokerId: string } }>('/reviews/broker/:brokerId', async (req, reply) => {
    if (!Types.ObjectId.isValid(req.params.brokerId)) {
      return fail(reply, 400, 'invalid_id', 'invalid broker id');
    }
    const brokerId = new Types.ObjectId(req.params.brokerId);
    const [docs, broker] = await Promise.all([
      ReviewModel.find({ broker_id: brokerId })
        .populate({ path: 'buyer_id', select: '_id name' })
        .sort({ created_at: -1 })
        .limit(100),
      UserModel.findById(brokerId).select('rating'),
    ]);
    return ok(reply, {
      rating: broker?.rating ?? { avg: 0, count: 0 },
      items: docs.map((d) => serializeReview(d as unknown as PopulatedReview)),
    });
  });

  // --- the buyer's own review of a broker (so the form can prefill) ---
  app.get<{ Params: { brokerId: string } }>(
    '/reviews/mine/:brokerId',
    { preHandler: [app.requireRole('buyer')] },
    async (req, reply) => {
      if (!Types.ObjectId.isValid(req.params.brokerId)) {
        return fail(reply, 400, 'invalid_id', 'invalid broker id');
      }
      const review = await ReviewModel.findOne({
        broker_id: new Types.ObjectId(req.params.brokerId),
        buyer_id: new Types.ObjectId(req.user.sub),
      });
      return ok(reply, {
        review: review ? serializeReview(review as unknown as PopulatedReview) : null,
      });
    },
  );
}
