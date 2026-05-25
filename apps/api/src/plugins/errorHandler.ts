import fp from 'fastify-plugin';
import { ValidationError } from '../lib/zod.js';
import { fail } from '../lib/reply.js';

interface MaybeHttpError {
  statusCode?: number;
  code?: string;
  message?: string;
}

export default fp(async (app) => {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ValidationError) {
      return fail(reply, err.status, err.code, err.message, err.details);
    }
    const e = err as MaybeHttpError;
    const status = typeof e.statusCode === 'number' ? e.statusCode : 500;
    if (status >= 500) req.log.error({ err }, 'unhandled error');
    return fail(
      reply,
      status,
      typeof e.code === 'string' ? e.code : 'internal_error',
      typeof e.message === 'string' && status < 500 ? e.message : 'something went wrong, try again',
    );
  });

  app.setNotFoundHandler((_req, reply) => {
    fail(reply, 404, 'not_found', 'route not found');
  });
});
