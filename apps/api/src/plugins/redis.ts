import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { env } from '../config.js';

export default fp(async (app) => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });
  client.on('error', (err) => app.log.error({ err }, 'redis error'));
  await client.ping();
  app.log.info('redis connected');
  app.decorate('redis', client);
  app.addHook('onClose', async () => {
    await client.quit();
  });
});
