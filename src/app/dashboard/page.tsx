import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isSupabaseConfigured = supabaseUrl && !supabaseUrl.includes('your_supabase') && supabaseUrl.startsWith('http')

  let user = null
  const stats = {
    networth: 0,
    partnership: 0,
    llp: 0,
    llpForm: 0,
    offerLetter: 0,
    salary: 0,
  }

  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) redirect('/login')
    user = authUser

    // Fetch stats for each agent
    const [
      { count: networthCount },
      { count: partnershipCount },
      { count: llpCount },
      { count: llpFormCount },
      { count: offerCount },
      { count: salaryCount },
    ] = await Promise.all([
      supabase.from('networth_certificates').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
      supabase.from('partnership_deeds').select('*', { count: 'exact', head: true }).eq('user_id', user.id).not('doc_url', 'is', null),
      supabase.from('llp_agreements').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_done', true),
      supabase.from('llp_agreements').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'draft'),
      supabase.from('offerletter_offers').select('*', { count: 'exact', head: true }).eq('user_id', user.id).not('doc_url', 'is', null),
      supabase.from('salary_results').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    stats.networth = networthCount ?? 0
    stats.partnership = partnershipCount ?? 0
    stats.llp = llpCount ?? 0
    stats.llpForm = llpFormCount ?? 0
    stats.offerLetter = offerCount ?? 0
    stats.salary = salaryCount ?? 0
  }

  return <DashboardClient user={user} stats={stats} />
}
