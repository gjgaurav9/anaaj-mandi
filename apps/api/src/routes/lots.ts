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

interface PublicBroker {
  _id: string;
  name: string | null;
  broker_mandi: string | null;
  phone?: string; // only present for authed buyers
}

function serializeLot(
  l: LotDoc,
  opts: { broker?: PublicBroker | null; revealSellerPhone?: boolean } = {},
) {
  return {
    _id: String(l._id),
    broker_id: String(l.broker_id),
    seller: {
      name: l.seller.name,
      // Farmer phone is broker-owned info, never exposed publicly.
      phone: opts.revealSellerPhone ? l.seller.phone : null,
      village: l.seller.village ?? null,
    },
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
    broker: opts.broker ?? null,
  };
}

async function loadBroker(
  brokerId: Types.ObjectId,
  revealPhone: boolean,
): Promise<PublicBroker | null> {
  const u = await UserModel.findById(brokerId).select('name broker_mandi phone');
  if (!u) return null;
  return {
    _id: String(u._id),
    name: u.name ?? null,
    broker_mandi: u.broker_mandi ?? null,
    ...(revealPhone ? { phone: u.phone } : {}),
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

  // --- my lots (broker) — defined BEFORE /lots/:id so the static path wins ---
  app.get('/lots/mine', { preHandler: [app.requireRole('broker')] }, async (req, reply) => {
    const brokerId = new Types.ObjectId(req.user.sub);
    const items = await LotModel.find({ broker_id: brokerId }).sort({ created_at: -1 }).limit(100);
    return ok(reply, { items: items.map((l) => serializeLot(l, { revealSellerPhone: true })) });
  });

  // --- Cloudinary signed upload params ---
  app.post(
    '/lots/photos/sign',
    { preHandler: [app.requireRole('broker')] },
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

  // --- detail ---
  app.get<{ Params: { id: string } }>('/lots/:id', async (req, reply) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return fail(reply, 400, 'invalid_id', 'invalid lot id');
    }
    const lot = await LotModel.findById(req.params.id);
    if (!lot) return fail(reply, 404, 'not_found', 'lot not found');

    LotModel.updateOne({ _id: lot._id }, { $inc: { view_count: 1 } }).catch((err) =>
      app.log.warn({ err }, 'view count increment failed'),
    );

    // Authed user? They get the broker's phone so the WhatsApp button can build
    // a real wa.me link. The broker who owns the lot also gets the seller phone
    // back (handy when editing).
    let revealBrokerPhone = false;
    let revealSellerPhone = false;
    try {
      await req.jwtVerify();
      revealBrokerPhone = true;
      revealSellerPhone = String(lot.broker_id) === req.user.sub || req.user.role === 'admin';
    } catch {
      // anonymous viewer — neither phone is exposed
    }

    const broker = await loadBroker(lot.broker_id, revealBrokerPhone);
    return ok(reply, { lot: serializeLot(lot, { broker, revealSellerPhone }) });
  });

  // --- create (broker only) ---
  app.post('/lots', { preHandler: [app.requireRole('broker')] }, async (req, reply) => {
    const body = parseOrThrow(CreateLotInputSchema, req.body);
    if (body.status === 'active' && body.photos.length === 0) {
      return fail(reply, 400, 'photos_required', 'active lots need at least one photo');
    }
    const lot = await LotModel.create({
      broker_id: new Types.ObjectId(req.user.sub),
      seller: body.seller,
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
    return ok(reply, { lot: serializeLot(lot, { revealSellerPhone: true }) }, 201);
  });

  // --- update (broker who owns it, or admin) ---
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

      const isOwner = String(lot.broker_id) === req.user.sub || req.user.role === 'admin';
      if (!isOwner) return fail(reply, 403, 'forbidden', 'not your lot');

      if (body.status === 'active' && lot.photos.length === 0 && (body.photos?.length ?? 0) === 0) {
        return fail(reply, 400, 'photos_required', 'active lots need at least one photo');
      }

      Object.assign(lot, body);
      await lot.save();
      return ok(reply, { lot: serializeLot(lot, { revealSellerPhone: true }) });
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
      const isOwner = String(lot.broker_id) === req.user.sub || req.user.role === 'admin';
      if (!isOwner) return fail(reply, 403, 'forbidden', 'not your lot');
      await lot.deleteOne();
      return ok(reply, { deleted: true });
    },
  );

  // --- attach photos to a lot ---
  app.post<{ Params: { id: string } }>(
    '/lots/:id/photos',
    { preHandler: [app.requireRole('broker')] },
    async (req, reply) => {
      if (!Types.ObjectId.isValid(req.params.id)) {
        return fail(reply, 400, 'invalid_id', 'invalid lot id');
      }
      const body = parseOrThrow(AttachPhotosInputSchema, req.body);
      const lot = await LotModel.findById(req.params.id);
      if (!lot) return fail(reply, 404, 'not_found', 'lot not found');
      if (String(lot.broker_id) !== req.user.sub) {
        return fail(reply, 403, 'forbidden', 'not your lot');
      }
      const combined = [...lot.photos, ...body.urls].slice(0, 5);
      lot.photos = combined;
      await lot.save();
      return ok(reply, { lot: serializeLot(lot, { revealSellerPhone: true }) });
    },
  );
}
