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
  // Note: 'disconnected' is also handled in index.ts to reset the dbConnected
  // flag so the lazy-connect middleware re-connects on the next request.
  mongoose.connection.on('connected', () => {
    console.log('[DB] Connected to MongoDB');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB connection error:', err.message);
    // Do NOT exit — the lazy-connect middleware will re-connect on the next request
  });

  await mongoose.connect(uri, {
    // ── Serverless-safe pool settings ──────────────────────────────────────
    // A pool of 10 on Vercel means 10 sockets opened per cold-start that
    // all get ECONNRESET when the function goes idle. 1-2 is the right
    // value for serverless — MongoDB Atlas free-tier also caps connections.
    maxPoolSize: 2,
    minPoolSize: 0,

    // ── Timeouts ───────────────────────────────────────────────────────────
    // Keep selection timeout short so a bad connection surfaces fast rather
    // than hanging a Vercel function for 30 seconds.
    serverSelectionTimeoutMS: 8_000,
    // Heartbeat less frequently — we don't need aggressive keep-alive in
    // serverless; it just generates unnecessary traffic.
    heartbeatFrequencyMS: 30_000,
    // How long a connection can sit idle in the pool before being closed.
    // Keeps idle sockets from accumulating between invocations.
    maxIdleTimeMS: 30_000,
    // How long to wait for a socket to connect.
    connectTimeoutMS: 10_000,
    // How long to wait for a socket read/write operation.
    socketTimeoutMS: 30_000,

    // ── Mongoose behaviour ─────────────────────────────────────────────────
    // bufferCommands: false means Mongoose rejects queries immediately when
    // disconnected instead of queuing them indefinitely, which causes the
    // "buffering timed out after 10000ms" errors on Vercel.
    bufferCommands: false,
  });
}
