// src/lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
};

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

type Entry = {
  count: number;
  resetTime: number;
};

export function rateLimit(options: Options = {}) {
  const tokenCache = new LRUCache<string, Entry>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000, // 1 minute default
  });

  return {
    check: async (request: Request, limit: number, token: string): Promise<RateLimitResult> => {
      const now = Date.now();
      const tokenEntry = tokenCache.get(token);

      let entry: Entry;

      if (!tokenEntry || now > tokenEntry.resetTime) {
        // Create new entry
        entry = {
          count: 0,
          resetTime: now + (options.interval || 60000),
        };
      } else {
        entry = tokenEntry;
      }

      entry.count += 1;
      tokenCache.set(token, entry);

      const remaining = Math.max(0, limit - entry.count);
      const reset = new Date(entry.resetTime);

      return {
        success: entry.count <= limit,
        limit,
        remaining,
        reset,
      };
    },
  };
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // Strict limit for payment processing
  payment: rateLimit({
    interval: 60 * 1000, // 1 minute window
    uniqueTokenPerInterval: 10000,
  }),

  // More relaxed for general API calls
  api: rateLimit({
    interval: 60 * 1000, // 1 minute window
    uniqueTokenPerInterval: 10000,
  }),

  // Very strict for authentication attempts
  auth: rateLimit({
    interval: 15 * 60 * 1000, // 15 minute window
    uniqueTokenPerInterval: 1000,
  }),
};
