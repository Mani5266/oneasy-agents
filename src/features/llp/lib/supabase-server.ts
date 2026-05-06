import { createClient } from "@/lib/supabase/server";

/**
 * Creates a Supabase client for server-side usage (API routes, Server Components).
 * Re-exports from the shared unified app server client.
 */
export async function createSupabaseServerClient() {
  return createClient();
}

/**
 * Creates a Supabase admin client (service role) for server-side operations
 * that need to bypass RLS.
 */
export function createSupabaseAdminClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
