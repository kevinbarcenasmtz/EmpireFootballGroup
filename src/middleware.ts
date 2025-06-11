import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  console.log('Middleware called for:', request.nextUrl.pathname);

  // Skip middleware entirely for login page
  if (request.nextUrl.pathname.startsWith('/login')) {
    console.log('Login page - skipping middleware');
    return NextResponse.next();
  }

  // for admin routes, check authentication with Supabase
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Admin route - checking Supabase auth');
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
