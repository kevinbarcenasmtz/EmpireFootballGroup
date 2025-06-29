// src/utils/supabase/service.ts
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `Supabase service client configuration error. ` +
        `NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}, ` +
        `SUPABASE_SERVICE_ROLE_KEY: ${!!serviceRoleKey}`
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
