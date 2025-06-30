import { type NextRequest, NextResponse } from 'next/server';

/**
 * Type guard to check if an object has the required user properties
 */
function isValidUserObject(
  obj: unknown
): obj is { id: string; email: string; [key: string]: unknown } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    typeof (obj as Record<string, unknown>).email === 'string'
  );
}

export async function middleware(request: NextRequest) {
  console.log('Middleware called for:', request.nextUrl.pathname);

  // Skip middleware for login, public payment pages, and API routes
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/pay/') ||
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // For admin routes, validate access token instead of creating Supabase session
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Admin route - validating access token');
    return await validateAccessToken(request);
  }

  return NextResponse.next();
}

async function validateAccessToken(request: NextRequest) {
  try {
    // Check for access token in multiple locations (following Reddit pattern)
    const authHeader = request.headers.get('authorization');
    const accessToken =
      authHeader?.replace('Bearer ', '') ||
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('supabase.auth.token')?.value;

    if (!accessToken) {
      console.log('No access token found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Validate token with Supabase API directly (no client creation needed)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase environment variables not configured');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Direct API call to validate token (Reddit pattern)
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('Token validation failed:', response.status);
      // Clear invalid token and redirect
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.cookies.delete('sb-access-token');
      redirectResponse.cookies.delete('supabase.auth.token');
      return redirectResponse;
    }

    const userData: unknown = await response.json();

    // Validate the response has the expected user structure
    if (!isValidUserObject(userData)) {
      console.error('Invalid user data structure received from Supabase');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('Token validated for user:', userData.email);

    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userData.id);
    requestHeaders.set('x-user-email', userData.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Error validating access token:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*', // Add this line
    '/api/collections/:path*', // Add this line
  ],
};
