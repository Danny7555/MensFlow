import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import cycleRoutes from './routes/cycleRoutes';
import partnerRoutes from './routes/partnerRoutes';
import chatRoutes from './routes/chatRoutes';

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Request Logger (development) ────────────────────────────────────────────

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

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

// ─── Centralised Error Handler ────────────────────────────────────────────────

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? 500;
  const message = err.message ?? 'An unexpected error occurred';
  console.error(`[ERROR] ${status} — ${message}`);
  res.status(status).json({ error: message });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const PORT = process.env.PORT ?? 5001;
  app.listen(PORT, () => console.log(`MensFlow API running on port ${PORT}`));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
