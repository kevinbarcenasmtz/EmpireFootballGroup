import { createClient } from './client';

// Safe client creation that won't break during build
export function createStaticSafeClient() {
  // During build time, return null instead of creating client
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not available during build time');
    return null;
  }

  // Only import and create client if we have proper environment
  try {
    return createClient();
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

// Mock client for build-time use
export const mockSupabaseClient = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithPassword: () => Promise.resolve({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
      limit: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ error: null }),
    }),
  }),
  removeChannel: () => {},
  channel: () => ({
    on: () => ({
      subscribe: () => {},
    }),
  }),
};

// Build-safe client factory
export function getBuildSafeClient() {
  const client = createStaticSafeClient();
  return client || mockSupabaseClient;
}
