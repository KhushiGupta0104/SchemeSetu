import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let embedded: { stop: (opts?: { doCleanup?: boolean }) => Promise<boolean> } | null = null;

/**
 * Connects to MongoDB. In development you can set USE_EMBEDDED_MONGO=true to run an
 * embedded mongod (via mongodb-memory-server) whose data is persisted to server/.data/mongo.
 * This is useful when MongoDB is not installed locally. Never used in production.
 */
export async function connectDatabase(): Promise<void> {
  let uri = env.MONGODB_URI;

  if (env.USE_EMBEDDED_MONGO) {
    if (env.isProd) throw new Error('USE_EMBEDDED_MONGO must not be used in production.');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve(process.cwd(), '.data', 'mongo');
    fs.mkdirSync(dbPath, { recursive: true });
    const server = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger', port: 27027 },
    });
    embedded = server;
    uri = server.getUri();
    logger.info({ dbPath }, 'Started embedded MongoDB (development only)');
  }

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Set it in server/.env, or run "npm run dev:memory" to use an embedded development database.',
    );
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: env.MONGODB_DB_NAME, serverSelectionTimeoutMS: 10000 });
  logger.info({ db: env.MONGODB_DB_NAME }, 'Connected to MongoDB');
}

export async function disconnectDatabase(): Promise<void> {
  if (embedded && mongoose.connection.readyState === 1) {
    // Flush recent writes to disk before the embedded mongod is stopped.
    await mongoose.connection.db!.admin().command({ fsync: 1 }).catch(() => undefined);
  }
  await mongoose.disconnect();
  if (embedded) await embedded.stop({ doCleanup: false });
}
