import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  // Check if we're in a build environment without proper environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or when environment variables are missing,
    // throw a descriptive error instead of trying to create the client
    throw new Error(
      `Supabase environment variables not found. ` +
        `NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}, ` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${!!supabaseAnonKey}. ` +
        `This function should only be called during request handling, not during build time.`
    );
  }

  // Only proceed if we have valid environment variables (runtime)
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Build-safe client creation for cases where we need conditional access
export function createClientSafe() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return null if environment variables are missing (build time)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase client creation skipped - missing environment variables');
    return null;
  }

  // For runtime with proper environment variables
  try {
    return createClient();
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

// Alternative client creation for Cloudflare Worker-style requests
export function createRequestClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not configured');
  }

  const cookieHeader = request.headers.get('cookie') || '';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (!cookieHeader) return [];

        return cookieHeader.split(';').map(cookie => {
          const [name, ...valueParts] = cookie.trim().split('=');
          return { name, value: valueParts.join('=') };
        });
      },
      setAll() {
        // In Cloudflare Workers/Edge environments,
        // cookie setting would be handled differently
        // This is mainly for token validation scenarios
      },
    },
  });
}
