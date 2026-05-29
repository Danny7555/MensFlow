import rateLimit, { type Options } from 'express-rate-limit';
import { isProduction } from '../config/env';

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 min
const AUTH_MAX           = parseEnvInt('RATE_LIMIT_AUTH_MAX', isProduction ? 20 : 100);
const API_MAX            = parseEnvInt('RATE_LIMIT_API_MAX',  isProduction ? 300 : 1000);
const WINDOW_MS          = parseEnvInt('RATE_LIMIT_WINDOW_MS', DEFAULT_WINDOW_MS);

const sharedOptions: Partial<Options> = {
  windowMs: WINDOW_MS,
  standardHeaders: true,  // Return `RateLimit-*` headers
  legacyHeaders: false,
  skipFailedRequests: false,
};

/**
 * Strict rate limiter for auth routes (login / register).
 * Brute-force protection: 20 req / 15 min in production.
 */
export const authLimiter = rateLimit({
  ...sharedOptions,
  max: AUTH_MAX,
  message: { error: 'Too many requests — please try again later' },
});

/**
 * General API rate limiter for all other routes.
 * 300 req / 15 min in production.
 */
export const apiLimiter = rateLimit({
  ...sharedOptions,
  max: API_MAX,
  message: { error: 'Too many requests — please try again later' },
});
