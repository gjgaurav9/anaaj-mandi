import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config.js';
import redisPlugin from './plugins/redis.js';
import mongoPlugin from './plugins/mongo.js';
import authPlugin from './plugins/auth.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import errorHandlerPlugin from './plugins/errorHandler.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';

async function build() {
  const app = Fastify({
    logger: {
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
            }
          : undefined,
    },
    trustProxy: true,
  });

  // CORS — same-site cookie story, but the web origin is on a different
  // port in dev so we still need an explicit allowlist.
  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(errorHandlerPlugin);
  await app.register(mongoPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);
  await app.register(rateLimitPlugin);

  app.get('/health', async () => ({ ok: true, data: { status: 'up', service: 'anaaj-api' } }));

  await app.register(authRoutes);
  await app.register(meRoutes);

  return app;
}

async function main() {
  const app = await build();
  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`anaaj-api listening on http://${env.API_HOST}:${env.API_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
