import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  shouldRetry?: (err: unknown) => boolean
  onRetry?: (attempt: number, err: unknown, delayMs: number) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 10_000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !shouldRetry(err)) throw err;

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.random() * delay * 0.2;
      const totalDelay = Math.round(delay + jitter);

      onRetry?.(attempt, err, totalDelay);
      logger.warn(`Retry attempt ${attempt}/${maxAttempts - 1} after ${totalDelay}ms`, {
        error: err instanceof Error ? err.message : String(err),
      });

      await new Promise((r) => setTimeout(r, totalDelay));
    }
  }

  throw lastErr;
}
