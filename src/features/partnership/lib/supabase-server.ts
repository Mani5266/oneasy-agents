import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client (cookie-based, RLS-aware).
 * Use in Server Components and API routes that need user session.
 */
export const createSupabaseServerClient = createClient;

/**
 * Admin client (service_role key, bypasses RLS).
 * Use for admin operations like verifying tokens.
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
  });
}
