import fp from 'fastify-plugin';
import { connectDb, disconnectDb } from '@anaaj/db';
import { env } from '../config.js';

export default fp(async (app) => {
  await connectDb({ uri: env.MONGO_URI });
  app.log.info('mongo connected');
  app.addHook('onClose', async () => {
    await disconnectDb();
  });
});
