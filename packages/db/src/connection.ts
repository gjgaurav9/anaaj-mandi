import mongoose from 'mongoose';

let connected = false;

export interface ConnectOptions {
  uri?: string;
  /** Override Mongoose's default DB name when the URI lacks one. */
  dbName?: string;
}

/**
 * Idempotent connect. Repeated calls return the same Mongoose instance
 * without re-dialling, which suits both long-running API processes and
 * one-shot scripts (seed, migrations).
 */
export async function connectDb(opts: ConnectOptions = {}): Promise<typeof mongoose> {
  if (connected) return mongoose;
  const uri = opts.uri ?? process.env.MONGO_URI;
  if (!uri) {
    throw new Error('connectDb: MONGO_URI is not set (neither argument nor env)');
  }
  await mongoose.connect(uri, opts.dbName ? { dbName: opts.dbName } : undefined);
  connected = true;
  return mongoose;
}

export async function disconnectDb(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

export { mongoose };
