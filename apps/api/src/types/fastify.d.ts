import 'fastify';
import '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@anaaj/types';
import type Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    /** Pre-handler that requires a valid JWT (header or cookie). */
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Pre-handler factory: require auth + one of the given roles. */
    requireRole: (...roles: Role[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** ioredis client. */
    redis: Redis;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: Role; phone: string };
    user: { sub: string; role: Role; phone: string };
  }
}
