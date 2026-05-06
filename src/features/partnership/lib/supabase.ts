import { createClient } from '@/lib/supabase/client';

// Re-export a singleton browser client for the partnership feature
export const supabase = createClient();
