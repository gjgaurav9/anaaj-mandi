import type { FastifyReply } from 'fastify';

export interface ApiOkBody<T> {
  ok: true;
  data: T;
}

export interface ApiErrBody {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}

export function ok<T>(reply: FastifyReply, data: T, status = 200): FastifyReply {
  return reply.code(status).send({ ok: true, data } satisfies ApiOkBody<T>);
}

export function fail(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): FastifyReply {
  return reply
    .code(status)
    .send({ ok: false, error: { code, message, details } } satisfies ApiErrBody);
}
