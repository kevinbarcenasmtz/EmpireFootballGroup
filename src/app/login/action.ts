// src/app/login/action.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { rateLimiters } from '@/lib/rate-limit';

export async function login(formData: FormData) {
  try {
    // Get IP address for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const cfConnectingIp = headersList.get('cf-connecting-ip'); // Cloudflare

    const ip = cfConnectingIp || forwardedFor?.split(',')[0] || realIp || 'unknown';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { error: 'Email and password are required' };
    }

    // Rate limit by IP address first
    const ipRateLimit = await rateLimiters.auth.check(
      {} as Request,
      10, // 10 login attempts per 15 minutes per IP
      `login_ip_${ip}`
    );

    if (!ipRateLimit.success) {
      console.warn('Login rate limit exceeded for IP:', ip);
      const waitMinutes = Math.ceil((ipRateLimit.reset.getTime() - Date.now()) / 60000);
      return {
        error: `Too many login attempts from this location. Please wait ${waitMinutes} minutes before trying again.`,
        rateLimitExceeded: true,
      };
    }

    // Rate limit by email (stricter to prevent account takeover)
    const emailRateLimit = await rateLimiters.auth.check(
      {} as Request,
      5, // 5 login attempts per 15 minutes per email
      `login_email_${email.toLowerCase()}`
    );

    if (!emailRateLimit.success) {
      console.warn('Login rate limit exceeded for email:', email);
      const waitMinutes = Math.ceil((emailRateLimit.reset.getTime() - Date.now()) / 60000);
      return {
        error: `Too many login attempts for this account. Please wait ${waitMinutes} minutes or reset your password.`,
        rateLimitExceeded: true,
      };
    }

    // Log rate limit usage
    console.log('Login rate limits:', {
      ip: `${ipRateLimit.remaining}/${ipRateLimit.limit}`,
      email: `${emailRateLimit.remaining}/${emailRateLimit.limit}`,
    });

    // Create Supabase client and attempt login
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Login error:', error.message);

      // Generic error message to prevent email enumeration
      const userFriendlyError = 'Invalid email or password';

      // If this was a failed attempt, also increment a combined rate limit
      const failedKey = `login_failed_${ip}_${email.toLowerCase()}`;
      await rateLimiters.auth.check(
        {} as Request,
        3, // Only 3 failed attempts allowed
        failedKey
      );

      return { error: userFriendlyError };
    }

    // Get the session after successful login
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      console.error('Session retrieval error:', sessionError);
      return { error: 'Login failed - please try again' };
    }

    // Set the access token cookie for middleware validation
    const cookieStore = await cookies();
    cookieStore.set('sb-access-token', session.access_token, {
      path: '/',
      maxAge: 3600, // 1 hour
      httpOnly: false, // Needs to be accessible to client-side for refresh
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    console.log('Login successful, cookie set for user:', session.user.email);

    // Clear any failed login rate limits on successful login
    // This is optional but provides better user experience
    // const failedKey = `login_failed_${ip}_${email.toLowerCase()}`;
    // Note: LRU cache doesn't have a delete method, so this will just reset on next attempt

    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Login action error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  // Redirect MUST be outside the try-catch to work properly
  redirect('/admin');
}
