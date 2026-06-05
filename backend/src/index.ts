import 'dotenv/config';
import crypto from 'crypto';
import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { getCorsOrigins, getPort, isProduction, validateRuntimeEnv } from './config/env';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import cycleRoutes from './routes/cycleRoutes';
import partnerRoutes from './routes/partnerRoutes';
import chatRoutes from './routes/chatRoutes';
import emailRoutes from './routes/emailRoutes';
import schedulerRoutes from './routes/schedulerRoutes';
import { startScheduler } from './services/schedulerService';
import educationRoutes from './routes/educationRoutes';
import { seedEducation } from './utils/seedEducation';
import wellnessTipRoutes from './routes/wellnessTipRoutes';
import { seedWellnessTips } from './utils/seedWellnessTips';
import path from 'path';
import uploadRoutes from './routes/uploadRoutes';
import { ensureUploadDirectories } from './controllers/uploadController';

const app = express();
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

// ─── Trust proxy (MUST be set before rate-limiters) ──────────────────────────
// Vercel and all load-balancer environments set X-Forwarded-For.
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// on every request and cannot identify the real client IP.
if (isVercel || isProduction) {
  app.set('trust proxy', 1); // trust the first hop (Vercel edge)
}

// ─── Global Middleware ────────────────────────────────────────────────────────

app.disable('x-powered-by');

// Attach a unique request ID to every request for log correlation
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Request-Id', crypto.randomUUID());
  next();
});

const corsOrigins = getCorsOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins === true || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    // Automatically allow any Vercel preview/deployment subdomains
    if (origin.endsWith('.vercel.app')) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '64kb' }));
app.use(express.text({ limit: '64kb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));

// Lazy DB connection for Serverless environments (Vercel)
// The dbConnected flag is reset on disconnect so the next request
// triggers a fresh connectDatabase() call rather than hitting a dead socket.
let dbConnected = false;
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  if (isVercel && !dbConnected) {
    try {
      await connectDatabase();
      dbConnected = true;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Reset the dbConnected flag whenever Mongoose drops the connection so that
// the lazy-connect middleware above will re-establish it on the next request.
mongoose.connection.on('disconnected', () => {
  dbConnected = false;
});

// ─── Request Logger (development) ────────────────────────────────────────────

if (!isProduction) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = res.getHeader('X-Request-Id');
    console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/logs', cycleRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/tips', wellnessTipRoutes);
app.use('/api/upload', uploadRoutes);
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'MensFlow API is running successfully' });
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown';
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ─── Not Found ───────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Centralised Error Handler ────────────────────────────────────────────────

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const { status, message } = getErrorResponse(err);
  const requestId = res.getHeader('X-Request-Id') ?? '-';
  console.error(`[ERROR] [${requestId}] ${req.method} ${req.path} — ${status}: ${message}`);
  console.error('Actual error details:', err);
  res.status(status).json({ error: message });
});

// ─── Process-level Safety Nets ────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception — shutting down:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection — shutting down:', reason);
  process.exit(1);
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  validateRuntimeEnv();
  ensureUploadDirectories();
  if (isVercel) {
    // Connect DB in the background on cold start
    connectDatabase().catch(err => console.error('[Vercel] DB warm connection error:', err));
    return;
  }
  await connectDatabase();
  await seedEducation();
  await seedWellnessTips();
  const PORT = getPort();
  const server = await listen(PORT);
  setupGracefulShutdown(server);

  // Start the daily email reminder scheduler
  // In dev mode, also fires immediately so you can verify it works
  startScheduler(!isProduction);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  if (!isVercel) {
    process.exit(1);
  }
});

export default app;

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function setupGracefulShutdown(server: http.Server): void {
  const shutdown = async (signal: string) => {
    console.log(`[${signal}] Received — starting graceful shutdown…`);

    server.close(async () => {
      console.log('HTTP server closed. Disconnecting from MongoDB…');
      try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected. Goodbye.');
      } catch (err) {
        console.error('Error disconnecting from MongoDB:', err);
      } finally {
        process.exit(0);
      }
    });

    // Force-kill after 10 s if server hasn't drained
    setTimeout(() => {
      console.error('Graceful shutdown timed out — forcing exit.');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getErrorResponse(err: unknown): { status: number; message: string } {
  if (err instanceof SyntaxError && 'body' in err) {
    return { status: 400, message: 'Malformed JSON body' };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return { status: 400, message: err.message };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { status: 400, message: 'Invalid identifier' };
  }

  if (isMongoDuplicateKeyError(err)) {
    return { status: 409, message: 'Duplicate record' };
  }

  if (typeof err === 'object' && err !== null) {
    const maybeStatus = 'status' in err ? Number(err.status) : 500;
    const status = Number.isInteger(maybeStatus) && maybeStatus >= 400 && maybeStatus < 600
      ? maybeStatus
      : 500;
    const rawMessage = 'message' in err && typeof err.message === 'string'
      ? err.message
      : 'An unexpected error occurred';

    return {
      status,
      message: isProduction && status >= 500 ? 'Internal server error' : rawMessage,
    };
  }

  return { status: 500, message: isProduction ? 'Internal server error' : 'An unexpected error occurred' };
}

function isMongoDuplicateKeyError(err: unknown): err is { code: number } {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}

function listen(port: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);

    server.once('listening', () => {
      console.log(`MensFlow API running on port ${port}`);
      resolve(server);
    });

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Set PORT to a free port and restart.`));
        return;
      }
      reject(err);
    });
  });
}
