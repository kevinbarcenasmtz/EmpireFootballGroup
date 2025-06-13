'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.log('Login error:', error.message);
    return { error: 'Invalid email or password' };
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

  revalidatePath('/', 'layout');
  redirect('/admin');
}
