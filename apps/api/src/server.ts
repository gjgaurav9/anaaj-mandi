import Fastify from 'fastify';

const PORT = Number(process.env.API_PORT ?? 4000);
const HOST = process.env.API_HOST ?? '0.0.0.0';

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
          }
        : undefined,
  },
});

app.get('/health', async () => ({ ok: true, data: { status: 'up', service: 'anaaj-api' } }));

app
  .listen({ port: PORT, host: HOST })
  .then(() => app.log.info(`anaaj-api listening on http://${HOST}:${PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
