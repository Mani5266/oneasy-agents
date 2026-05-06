import { createClient } from "@/lib/supabase/client";

/**
 * Browser-side Supabase client (singleton).
 * Re-exports from the shared unified app client.
 */
export const supabase = createClient();
