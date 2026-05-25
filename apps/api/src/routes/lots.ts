import type { FastifyInstance } from 'fastify';
import { Types, type FilterQuery } from 'mongoose';
import { LotModel, UserModel, type ILot, type LotDoc } from '@anaaj/db';
import {
  AttachPhotosInputSchema,
  CreateLotInputSchema,
  ListLotsQuerySchema,
  UpdateLotInputSchema,
} from '@anaaj/types';
import { parseOrThrow } from '../lib/zod.js';
import { fail, ok } from '../lib/reply.js';
import { signLotUpload } from '../services/cloudinary.js';

function serializeLot(l: LotDoc, populate?: { seller?: unknown; broker?: unknown }) {
  return {
    _id: String(l._id),
    seller_id: String(l.seller_id),
    broker_id: l.broker_id ? String(l.broker_id) : null,
    grain: l.grain,
    variety: l.variety,
    quantity_quintals: l.quantity_quintals,
    price_per_quintal: l.price_per_quintal,
    quality: l.quality,
    photos: l.photos,
    pickup_location: l.pickup_location,
    available_from: l.available_from,
    status: l.status,
    view_count: l.view_count,
    inquiry_count: l.inquiry_count,
    created_at: l.created_at,
    updated_at: l.updated_at,
    seller: populate?.seller ?? null,
    broker: populate?.broker ?? null,
  };
}

function publicUser(u: {
  _id: Types.ObjectId;
  name?: string;
  role: string;
  broker_mandi?: string;
  buyer_company?: string;
}) {
  return {
    _id: String(u._id),
    name: u.name ?? null,
    role: u.role,
    broker_mandi: u.broker_mandi ?? null,
    buyer_company: u.buyer_company ?? null,
  };
}

export default async function lotsRoutes(app: FastifyInstance) {
  // --- list ---
  app.get('/lots', async (req, reply) => {
    const q = parseOrThrow(ListLotsQuerySchema, req.query ?? {});
    const filter: FilterQuery<ILot> = { status: q.status ?? 'active' };
    if (q.variety) filter.variety = q.variety;
    if (q.min_qty || q.max_qty) {
      filter.quantity_quintals = {};
      if (q.min_qty) filter.quantity_quintals.$gte = q.min_qty;
      if (q.max_qty) filter.quantity_quintals.$lte = q.max_qty;
    }
    if (q.min_price || q.max_price) {
      filter.price_per_quintal = {};
      if (q.min_price) filter.price_per_quintal.$gte = q.min_price;
      if (q.max_price) filter.price_per_quintal.$lte = q.max_price;
    }
    if (q.near_lat !== undefined && q.near_lng !== undefined) {
      const radiusKm = q.radius_km ?? 50;
      filter['pickup_location.geo'] = {
        $geoWithin: {
          $centerSphere: [[q.near_lng, q.near_lat], radiusKm / 6378.1],
        },
      };
    }
    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      LotModel.find(filter).sort({ created_at: -1 }).skip(skip).limit(q.limit),
      LotModel.countDocuments(filter),
    ]);
    return ok(reply, {
      items: items.map((l) => serializeLot(l)),
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        has_more: skip + items.length < total,
      },
    });
  });

  // --- detail ---
  app.get<{ Params: { id: string } }>('/lots/:id', async (req, reply) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return fail(reply, 400, 'invalid_id', 'invalid lot id');
    }
    const lot = await LotModel.findById(req.params.id);
    if (!lot) return fail(reply, 404, 'not_found', 'lot not found');

    // Fire-and-forget view count bump.
    LotModel.updateOne({ _id: lot._id }, { $inc: { view_count: 1 } }).catch((err) =>
      app.log.warn({ err }, 'view count increment failed'),
    );

    const [seller, broker] = await Promise.all([
      UserModel.findById(lot.seller_id).select('name role broker_mandi buyer_company'),
      lot.broker_id
        ? UserModel.findById(lot.broker_id).select('name role broker_mandi buyer_company')
        : Promise.resolve(null),
    ]);

    return ok(reply, {
      lot: serializeLot(lot, {
        seller: seller ? publicUser(seller) : null,
        broker: broker ? publicUser(broker) : null,
      }),
    });
  });

  // --- create ---
  app.post('/lots', { preHandler: [app.requireRole('seller', 'broker')] }, async (req, reply) => {
    const body = parseOrThrow(CreateLotInputSchema, req.body);
    const ownerRole = req.user.role;

    let sellerId: Types.ObjectId;
    let brokerId: Types.ObjectId | undefined;

    if (ownerRole === 'seller') {
      sellerId = new Types.ObjectId(req.user.sub);
      if (body.broker_id && !Types.ObjectId.isValid(body.broker_id)) {
        return fail(reply, 400, 'invalid_id', 'invalid broker_id');
      }
      brokerId = body.broker_id ? new Types.ObjectId(body.broker_id) : undefined;
    } else {
      // broker listing on behalf of a seller
      if (!body.seller_id || !Types.ObjectId.isValid(body.seller_id)) {
        return fail(reply, 400, 'seller_required', 'broker must pass seller_id');
      }
      sellerId = new Types.ObjectId(body.seller_id);
      brokerId = new Types.ObjectId(req.user.sub);
    }

    // Active lots must have at least one photo; drafts may have zero.
    if (body.status === 'active' && body.photos.length === 0) {
      return fail(reply, 400, 'photos_required', 'active lots need at least one photo');
    }

    const lot = await LotModel.create({
      seller_id: sellerId,
      broker_id: brokerId,
      grain: body.grain,
      variety: body.variety,
      quantity_quintals: body.quantity_quintals,
      price_per_quintal: body.price_per_quintal,
      quality: body.quality,
      photos: body.photos,
      pickup_location: body.pickup_location,
      available_from: body.available_from,
      status: body.status,
    });
    return ok(reply, { lot: serializeLot(lot) }, 201);
  });

  // --- update ---
  app.patch<{ Params: { id: string } }>(
    '/lots/:id',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return fail(reply, 400, 'invalid_id', 'invalid lot id');
      }
      const body = parseOrThrow(UpdateLotInputSchema, req.body);
      const lot = await LotModel.findById(req.params.id);
      if (!lot) return fail(reply, 404, 'not_found', 'lot not found');

      const userId = req.user.sub;
      const isOwner =
        String(lot.seller_id) === userId ||
        (lot.broker_id && String(lot.broker_id) === userId) ||
        req.user.role === 'admin';
      if (!isOwner) return fail(reply, 403, 'forbidden', 'not your lot');

      if (body.status === 'active' && lot.photos.length === 0 && (body.photos?.length ?? 0) === 0) {
        return fail(reply, 400, 'photos_required', 'active lots need at least one photo');
      }

      Object.assign(lot, body);
      await lot.save();
      return ok(reply, { lot: serializeLot(lot) });
    },
  );

  // --- delete ---
  app.delete<{ Params: { id: string } }>(
    '/lots/:id',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return fail(reply, 400, 'invalid_id', 'invalid lot id');
      }
      const lot = await LotModel.findById(req.params.id);
      if (!lot) return fail(reply, 404, 'not_found', 'lot not found');
      const userId = req.user.sub;
      const isOwner =
        String(lot.seller_id) === userId ||
        (lot.broker_id && String(lot.broker_id) === userId) ||
        req.user.role === 'admin';
      if (!isOwner) return fail(reply, 403, 'forbidden', 'not your lot');
      await lot.deleteOne();
      return ok(reply, { deleted: true });
    },
  );

  // --- my lots ---
  app.get(
    '/lots/mine',
    { preHandler: [app.requireRole('seller', 'broker')] },
    async (req, reply) => {
      const userId = new Types.ObjectId(req.user.sub);
      const filter: FilterQuery<ILot> =
        req.user.role === 'broker' ? { broker_id: userId } : { seller_id: userId };
      const items = await LotModel.find(filter).sort({ created_at: -1 }).limit(100);
      return ok(reply, { items: items.map((l) => serializeLot(l)) });
    },
  );

  // --- Cloudinary signed upload params ---
  app.post(
    '/lots/photos/sign',
    { preHandler: [app.requireRole('seller', 'broker')] },
    async (_req, reply) => {
      try {
        const params = signLotUpload();
        return ok(reply, { upload: params });
      } catch (err) {
        if (err instanceof Error) {
          return fail(reply, 503, 'cloudinary_not_configured', err.message);
        }
        throw err;
      }
    },
  );

  // --- attach photos to a lot ---
  app.post<{ Params: { id: string } }>(
    '/lots/:id/photos',
    { preHandler: [app.requireRole('seller', 'broker')] },
    async (req, reply) => {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return fail(reply, 400, 'invalid_id', 'invalid lot id');
      }
      const body = parseOrThrow(AttachPhotosInputSchema, req.body);
      const lot = await LotModel.findById(req.params.id);
      if (!lot) return fail(reply, 404, 'not_found', 'lot not found');
      const userId = req.user.sub;
      const isOwner =
        String(lot.seller_id) === userId || (lot.broker_id && String(lot.broker_id) === userId);
      if (!isOwner) return fail(reply, 403, 'forbidden', 'not your lot');

      const combined = [...lot.photos, ...body.urls].slice(0, 5);
      lot.photos = combined;
      await lot.save();
      return ok(reply, { lot: serializeLot(lot) });
    },
  );
}
