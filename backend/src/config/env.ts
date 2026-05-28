const DEFAULT_DEV_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
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
    return isProduction ? [] : DEFAULT_DEV_CORS_ORIGINS;
  }

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.includes('*')) {
    if (isProduction) {
      throw new Error('Wildcard CORS origin is not allowed in production');
    }
    return true;
  }

  return origins;
}

