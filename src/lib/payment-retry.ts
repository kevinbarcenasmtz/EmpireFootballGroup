// src/lib/payment-retry.ts

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RetryState {
  attempt: number;
  canRetry: boolean;
  nextRetryDelay: number;
  totalAttempts: number;
}

interface NetworkError extends Error {
  name: 'NetworkError';
}

interface TypeError extends Error {
  name: 'TypeError';
}

interface SquareError extends Error {
  statusCode?: number;
  body?: {
    errors?: Array<{
      code: string;
      detail?: string;
      field?: string;
    }>;
  };
}

interface ServerError extends Error {
  isServerError?: boolean;
}

type RetryableError = NetworkError | TypeError | SquareError | ServerError | Error;

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

export class PaymentRetryManager {
  private options: RetryOptions;
  private currentAttempt: number = 0;
  private lastError: RetryableError | null = null;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay = this.options.baseDelay * Math.pow(this.options.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.options.maxDelay);
  }

  /**
   * Determine if we should retry based on the error and current state
   */
  public shouldRetry(error: RetryableError): boolean {
    this.lastError = error;

    // Check if we've exceeded max attempts
    if (this.currentAttempt >= this.options.maxAttempts) {
      return false;
    }

    // Check if this type of error is retryable
    // This would integrate with your Square error handling
    return this.isRetryableError(error);
  }

  /**
   * Check if an error is retryable based on Square error codes
   */
  private isRetryableError(error: RetryableError): boolean {
    // Network errors are generally retryable
    if (error?.name === 'NetworkError' || error?.name === 'TypeError') {
      return true;
    }

    // Square-specific error handling
    const squareError = error as SquareError;
    const statusCode = squareError?.statusCode;
    const errorCode = squareError?.body?.errors?.[0]?.code;

    // Non-retryable status codes
    if (statusCode && [401, 403, 404, 422].includes(statusCode)) {
      return false;
    }

    // Non-retryable Square error codes
    const nonRetryableCodes = [
      'CARD_TOKEN_EXPIRED',
      'CARD_TOKEN_USED',
      'ALLOWABLE_PIN_TRIES_EXCEEDED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
    ];

    if (errorCode && nonRetryableCodes.includes(errorCode)) {
      return false;
    }

    return true;
  }

  /**
   * Execute a payment operation with retry logic
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: RetryableError) => void
  ): Promise<T> {
    this.currentAttempt = 0;

    while (this.currentAttempt < this.options.maxAttempts) {
      this.currentAttempt++;

      try {
        const result = await operation();
        // Reset on success
        this.currentAttempt = 0;
        return result;
      } catch (error) {
        const retryableError = error as RetryableError;
        console.log(`Payment attempt ${this.currentAttempt} failed:`, retryableError);

        // If this is the last attempt or error is not retryable, throw
        if (
          this.currentAttempt >= this.options.maxAttempts ||
          !this.isRetryableError(retryableError)
        ) {
          throw retryableError;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(this.currentAttempt);
        console.log(
          `Retrying payment in ${delay}ms... (attempt ${this.currentAttempt + 1}/${this.options.maxAttempts})`
        );

        // Call retry callback if provided
        if (onRetry) {
          onRetry(this.currentAttempt, retryableError);
        }

        // Wait before retrying
        await new Promise<void>(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but just in case
    throw this.lastError;
  }

  /**
   * Get current retry state for UI feedback
   */
  public getRetryState(): RetryState {
    return {
      attempt: this.currentAttempt,
      canRetry: this.currentAttempt < this.options.maxAttempts,
      nextRetryDelay: this.calculateDelay(this.currentAttempt),
      totalAttempts: this.options.maxAttempts,
    };
  }

  /**
   * Reset the retry manager
   */
  public reset(): void {
    this.currentAttempt = 0;
    this.lastError = null;
  }
}

/**
 * Simple retry function for one-off operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryManager = new PaymentRetryManager(options);
  return retryManager.executeWithRetry(operation);
}

/**
 * Create a delay promise for manual retry timing
 */
export function createDelay(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
