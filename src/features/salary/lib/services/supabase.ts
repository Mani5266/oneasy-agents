/**
 * Supabase client wrapper for the salary feature.
 * Re-uses the unified app's shared Supabase client from @/lib/supabase/server.
 */

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return Boolean(url && key && url !== "your_supabase_url_here");
}

/**
 * Get a Supabase client instance.
 * Returns null if Supabase is not configured.
 * NOTE: This is async because the unified app's createClient is async.
 */
export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    return await createClient();
  } catch (e) {
    console.warn("Failed to create Supabase client:", e);
    return null;
  }
}
