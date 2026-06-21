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

  async function attempt(currentAttempt: number): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (currentAttempt === maxAttempts || !shouldRetry(err)) {
        throw err;
      }

      const delay = Math.min(baseDelayMs * 2 ** (currentAttempt - 1), maxDelayMs);
      const jitter = Math.random() * delay * 0.2;
      const totalDelay = Math.round(delay + jitter);

      onRetry?.(currentAttempt, err, totalDelay);
      logger.warn(`Retry attempt ${currentAttempt}/${maxAttempts - 1} after ${totalDelay}ms`, {
        error: err instanceof Error ? err.message : String(err),
      });

      await new Promise((r) => setTimeout(r, totalDelay));
      return attempt(currentAttempt + 1);
    }
  }

  return attempt(1);
}
