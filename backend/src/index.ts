import 'dotenv/config';
import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { getCorsOrigins, getPort, isProduction, validateRuntimeEnv } from './config/env';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import cycleRoutes from './routes/cycleRoutes';
import partnerRoutes from './routes/partnerRoutes';
import chatRoutes from './routes/chatRoutes';

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.disable('x-powered-by');

const corsOrigins = getCorsOrigins();
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins === true || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '64kb' }));

// ─── Request Logger (development) ────────────────────────────────────────────

if (!isProduction) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/logs', cycleRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/chat', chatRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Not Found ───────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Centralised Error Handler ────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const { status, message } = getErrorResponse(err);
  console.error(`[ERROR] ${status} — ${message}`);
  res.status(status).json({ error: message });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  validateRuntimeEnv();
  await connectDatabase();
  const PORT = getPort();
  await listen(PORT);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

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
