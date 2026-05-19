import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isSupabaseConfigured = supabaseUrl && !supabaseUrl.includes('your_supabase') && supabaseUrl.startsWith('http')

  let user = null

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    // Use getSession() for fast local JWT check — middleware already guards this route
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) redirect('/login')
    user = session.user
  }

  // Stats are now loaded client-side for instant page render
  return <DashboardClient user={user} stats={{ networth: 0, partnership: 0, llp: 0, llpForm: 0, offerLetter: 0, salary: 0 }} />
}
