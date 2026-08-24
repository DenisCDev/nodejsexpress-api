import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 20_000,
  maxPoolSize: 10,
  minPoolSize: 0,
} as const;

export async function connectDB(uri: string = env.MONGODB_URI): Promise<void> {
  await mongoose.connect(uri, CONNECT_OPTIONS);
  logger.info({ host: mongoose.connection.host }, 'mongodb connected');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('mongodb disconnected');
}

export async function pingDB(): Promise<boolean> {
  const db = mongoose.connection.db;
  if (mongoose.connection.readyState !== mongoose.ConnectionStates.connected || !db) return false;
  try {
    await db.admin().command({ ping: 1 }, { timeoutMS: 2_000 });
    return true;
  } catch (err) {
    logger.warn({ err }, 'mongodb ping failed');
    return false;
  }
}
