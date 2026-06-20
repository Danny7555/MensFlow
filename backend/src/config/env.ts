const DEFAULT_DEV_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5176',
  'http://127.0.0.1:3000',
];

export const isProduction = process.env.NODE_ENV === 'production';

let jwtSecret: string | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function validateRuntimeEnv(): void {
  requiredEnv('MONGO_URI');
  getJwtSecret();
  if (process.env.NODE_ENV === 'production') {
    // Email service — required for auth (OTP, password reset)
    if (process.env.SMTP_HOST || process.env.SMTP_USER) {
      requiredEnv('SMTP_HOST');
      requiredEnv('SMTP_USER');
      requiredEnv('SMTP_PASS');
    }
    // Cron job security
    if (!process.env.CRON_SECRET) {
      console.warn('[Env] CRON_SECRET not set — scheduler endpoints will be unprotected');
    }
  }
}

export function getJwtSecret(): string {
  if (!jwtSecret) {
    const value = requiredEnv('JWT_SECRET');
    if (isProduction && value.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    jwtSecret = value;
  }
  return jwtSecret;
}

export function getPort(): number {
  const raw = process.env.PORT;
  if (!raw) return 5001;

  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }
  return port;
}

export function getCorsOrigins(): string[] | true {
  const raw = process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN;
  if (!raw) {
    if (isProduction) {
      const vercelUrl = process.env.VERCEL_URL;
      return vercelUrl ? [`https://${vercelUrl}`] : [];
    }
    return DEFAULT_DEV_CORS_ORIGINS;
  }

  const origins = raw
    .split(',')
    .flatMap(origin => { const t = origin.trim(); return t ? [t] : []; });

  if (origins.includes('*')) {
    if (isProduction) {
      throw new Error('Wildcard CORS origin is not allowed in production');
    }
    return true;
  }

  return origins;
}

