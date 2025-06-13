// src/lib/square.ts
import { SquareClient } from 'square';

// TypeScript declaration for BigInt toJSON method
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// BigInt serialization fix for JSON.stringify()
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Create Square client factory function
export function createSquareClient(env?: CloudflareEnv) {
  const token = env?.SQUARE_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN;
  const environment = env?.SQUARE_ENVIRONMENT || process.env.SQUARE_ENVIRONMENT || 'sandbox';

  if (!token) {
    throw new Error('SQUARE_ACCESS_TOKEN is required');
  }

  console.log('Creating Square client with:', {
    hasToken: !!token,
    environment,
    tokenPrefix: token?.substring(0, 10) + '...',
  });

  return new SquareClient({
    token,
    environment: environment as 'sandbox' | 'production',
  });
}

// Default client for development
export const squareClient = createSquareClient();
