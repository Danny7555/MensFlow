import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    logger.debug('Already connected to MongoDB (cached)');
    return;
  }
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  mongoose.connection.on('connected', () => {
    logger.info('Connected to MongoDB');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });

  await mongoose.connect(uri, {
    maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE || (process.env.VERCEL === '1' ? '2' : '20'), 10),
    minPoolSize: 0,
    serverSelectionTimeoutMS: 8_000,
    heartbeatFrequencyMS: 30_000,
    maxIdleTimeMS: 30_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 30_000,
    bufferCommands: false,
  });
}
