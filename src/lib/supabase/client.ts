import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 0

export function createClient() {
  if (!isConfigured) {
    // Return a mock client that no-ops for demo/dev without credentials
    return null as any
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
