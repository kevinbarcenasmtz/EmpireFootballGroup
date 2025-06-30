// src/lib/api-rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from './rate-limit';

export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    limit?: number;
    windowMs?: number;
    keyGenerator?: (request: NextRequest) => string;
  } = {}
) {
  const { limit = 60, keyGenerator } = options;

  // Get identifier for rate limiting
  const identifier = keyGenerator
    ? keyGenerator(request)
    : request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

  const result = await rateLimiters.api.check(
    request as unknown as Request,
    limit,
    `api_${identifier}`
  );

  // Add rate limit headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toISOString());

  if (!result.success) {
    headers.set('Retry-After', Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString());

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((result.reset.getTime() - Date.now()) / 1000)} seconds.`,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  // Process request
  const response = await handler(request);

  // Add rate limit headers to successful response
  Object.entries(Object.fromEntries(headers)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
