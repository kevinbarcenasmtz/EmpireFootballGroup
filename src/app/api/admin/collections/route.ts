// Example: src/app/api/admin/collections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/api-rate-limit';

export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    // Your existing API logic here
    return NextResponse.json({ collections: [] });
  }, {
    limit: 30, // 30 requests per minute
  });
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    // Your existing API logic here
    return NextResponse.json({ success: true });
  }, {
    limit: 10, // 10 POST requests per minute
  });
}