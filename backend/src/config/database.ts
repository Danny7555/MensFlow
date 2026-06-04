import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    console.log('[DB] Already connected to MongoDB (cached)');
    return;
  }
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  // ─── Connection event handlers ────────────────────────────────────────────
  mongoose.connection.on('connected', () => {
    console.log('[DB] Connected to MongoDB');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected — reconnecting automatically…');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB connection error:', err);
    // Do NOT exit — Mongoose will attempt to reconnect automatically
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    heartbeatFrequencyMS: 10_000,
    maxPoolSize: 10,
  });
}
