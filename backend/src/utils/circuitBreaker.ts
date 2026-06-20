import { logger } from './logger';

type State = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold?: number
  successThreshold?: number
  resetTimeoutMs?: number
  name?: string
}

export class CircuitBreaker {
  private state: State = 'closed'
  private failureCount = 0
  private successCount = 0
  private lastFailureTime = 0
  private readonly failureThreshold: number
  private readonly successThreshold: number
  private readonly resetTimeoutMs: number
  private readonly name: string

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5
    this.successThreshold = options.successThreshold ?? 2
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30_000
    this.name = options.name ?? 'unnamed'
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'half-open'
        logger.info(`Circuit breaker "${this.name}" → half-open`)
      } else {
        throw new Error(`Circuit breaker "${this.name}" is open`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure()
      throw err
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.reset()
        logger.info(`Circuit breaker "${this.name}" → closed (recovered)`)
      }
    } else {
      this.failureCount = 0
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold && this.state === 'closed') {
      this.state = 'open'
      logger.warn(`Circuit breaker "${this.name}" → open (${this.failureCount} failures)`)
    }
  }

  getState(): State {
    return this.state
  }

  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
  }
}
