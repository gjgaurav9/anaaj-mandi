import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { env } from '../config.js';
import { fail } from '../lib/reply.js';
import type { Role } from '@anaaj/types';

export default fp(async (app) => {
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: env.JWT_COOKIE_NAME, signed: false },
    sign: { expiresIn: `${env.JWT_TTL_DAYS}d` },
  });

  app.decorate('authenticate', async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      return fail(reply, 401, 'unauthenticated', 'authentication required');
    }
  });

  app.decorate('requireRole', (...roles: Role[]) => {
    return async (req, reply) => {
      try {
        await req.jwtVerify();
      } catch {
        return fail(reply, 401, 'unauthenticated', 'authentication required');
      }
      if (!roles.includes(req.user.role)) {
        return fail(reply, 403, 'forbidden', `role required: ${roles.join(' | ')}`);
      }
    };
  });
});
