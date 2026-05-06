import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isConfigured = supabaseUrl.startsWith("http") && supabaseAnonKey.length > 0;

if (!isConfigured) {
  console.warn("Supabase credentials missing. Check your .env.local file.");
}

export const supabase = isConfigured
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createBrowserClient>);
