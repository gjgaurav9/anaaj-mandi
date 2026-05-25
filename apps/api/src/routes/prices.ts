import type { FastifyInstance } from 'fastify';
import { PriceTickModel, type PriceTickDoc } from '@anaaj/db';
import { fail, ok } from '../lib/reply.js';

const CACHE_KEY_PREFIX = 'prices:today:';
const CACHE_TTL_SECONDS = 60 * 60; // 1h

function serialize(t: PriceTickDoc) {
  return {
    _id: String(t._id),
    grain: t.grain,
    mandi: t.mandi,
    variety: t.variety,
    price_min: t.price_min,
    price_max: t.price_max,
    price_modal: t.price_modal,
    source: t.source,
    date: t.date,
  };
}

function todayStartUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function todayKey(): string {
  return `${CACHE_KEY_PREFIX}${todayStartUTC().toISOString().slice(0, 10)}`;
}

export default async function pricesRoutes(app: FastifyInstance) {
  app.get('/prices/today', async (_req, reply) => {
    const cacheKey = todayKey();
    const cached = await app.redis.get(cacheKey);
    if (cached) {
      try {
        return ok(reply, { items: JSON.parse(cached), source: 'cache' });
      } catch {
        // fall through to live read if cache is corrupt
      }
    }
    const since = todayStartUTC();
    const ticks = await PriceTickModel.find({ date: { $gte: since } }).sort({
      mandi: 1,
      variety: 1,
    });
    const serialized = ticks.map(serialize);
    await app.redis.set(cacheKey, JSON.stringify(serialized), 'EX', CACHE_TTL_SECONDS);
    return ok(reply, { items: serialized, source: 'db' });
  });

  // Internal helper: admin /admin/prices route invalidates this key after writes.
  app.decorate('invalidatePricesCache', async () => {
    await app.redis.del(todayKey());
  });

  app.get('/prices/__cache_status', async (_req, reply) => {
    const exists = await app.redis.exists(todayKey());
    if (!exists) return fail(reply, 404, 'no_cache', 'prices not cached');
    return ok(reply, { cached: true, key: todayKey() });
  });
}
