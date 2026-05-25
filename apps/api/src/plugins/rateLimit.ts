import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

/**
 * Global IP-based rate limit (100 req/min/IP). Per-route caps are layered on
 * top via per-route `config.rateLimit`. The OTP-send route uses a Redis-backed
 * sliding window keyed on phone (see services/otp.ts) for stricter throttling.
 */
export default fp(async (app) => {
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: app.redis,
    keyGenerator: (req) => req.ip,
  });
});
