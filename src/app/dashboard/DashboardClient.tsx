'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, Handshake, FileText, Mail, Calculator, 
  LogOut, ArrowRight, Search, Sparkles
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AgentCard {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  stat: number
  statLabel: string
  accentColor: string
  iconBg: string
}

interface Props {
  user: SupabaseUser | null
  stats: {
    networth: number
    partnership: number
    llp: number
    offerLetter: number
    salary: number
  }
}

export default function DashboardClient({ user, stats }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const routes = ['/networth', '/partnership', '/llp', '/offer-letter', '/salary']
      const num = parseInt(e.key)
      if (num >= 1 && num <= 5) router.push(routes[num - 1])
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const agents: AgentCard[] = [
    {
      id: 'networth',
      title: 'Net Worth Certificate',
      description: 'Generate AI-powered net worth certificates with document analysis',
      icon: Shield,
      href: '/networth',
      stat: stats.networth,
      statLabel: 'certificates',
      accentColor: '#f59e0b',
      iconBg: 'bg-amber-50',
    },
    {
      id: 'partnership',
      title: 'Partnership Deed',
      description: 'Draft partnership deeds with multi-partner support and AI assistance',
      icon: Handshake,
      href: '/partnership',
      stat: stats.partnership,
      statLabel: 'deeds',
      accentColor: '#3b82f6',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'llp',
      title: 'LLP Agreement',
      description: 'Create LLP agreements through guided AI chat with live document preview',
      icon: FileText,
      href: '/llp',
      stat: stats.llp,
      statLabel: 'agreements',
      accentColor: '#10b981',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 'offer-letter',
      title: 'Offer Letter',
      description: 'Create professional offer letters with auto-calculated salary breakdowns',
      icon: Mail,
      href: '/offer-letter',
      stat: stats.offerLetter,
      statLabel: 'offers',
      accentColor: '#8b5cf6',
      iconBg: 'bg-violet-50',
    },
    {
      id: 'salary',
      title: 'Salary Calculator',
      description: 'CTC structuring, payslip generation, tax comparison & statutory compliance',
      icon: Calculator,
      href: '/salary',
      stat: stats.salary,
      statLabel: 'calculations',
      accentColor: '#06b6d4',
      iconBg: 'bg-cyan-50',
    },
  ]

  const filteredAgents = agents.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleLogout = async () => {
    await supabase?.auth.signOut()
    router.push('/login')
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const totalDocs = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] flex items-center justify-center">
              <span className="text-white font-black text-xs">O</span>
            </div>
            <span className="text-[17px] font-bold text-[#0f172a] tracking-[-0.02em]">OnEasy</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f1f5f9] border border-[#e2e8f0]">
              <div className="w-5 h-5 rounded-full bg-[#0f172a] flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-[13px] text-[#475569] font-medium max-w-[180px] truncate">
                {user?.email || 'Demo Mode'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-all duration-200"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        {/* Hero Section */}
        <div className="mb-12">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f172a]/[0.03] border border-[#0f172a]/[0.06] mb-5"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.5s ease' }}
          >
            <Sparkles size={13} className="text-[#0f172a]" />
            <span className="text-[12px] font-semibold text-[#0f172a] tracking-wide uppercase">
              AI Document Platform
            </span>
          </div>
          <h1
            className="text-[2.25rem] font-bold text-[#0f172a] leading-tight tracking-[-0.025em] mb-3"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease 0.1s' }}
          >
            Welcome back, {userName}
          </h1>
          <p
            className="text-[15px] text-[#64748b] leading-relaxed max-w-lg"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease 0.15s' }}
          >
            Select an agent to generate professional documents. 
            {totalDocs > 0 && <span className="text-[#0f172a] font-medium"> {totalDocs} documents generated so far.</span>}
          </p>
        </div>

        {/* Search */}
        <div
          className="relative max-w-sm mb-10"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease 0.2s' }}
        >
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 focus:border-[#0f172a]/20 transition-all duration-200"
          />
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent, i) => (
            <button
              key={agent.id}
              onClick={() => router.push(agent.href)}
              className="group relative text-left p-6 rounded-2xl bg-white border border-[#e5e7eb] hover:border-[#cbd5e1] hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.25 + i * 0.06}s`,
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: agent.accentColor }}
              />

              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl ${agent.iconBg} flex items-center justify-center mb-5`}>
                <agent.icon size={20} style={{ color: agent.accentColor }} />
              </div>

              {/* Content */}
              <h3 className="text-[15px] font-semibold text-[#0f172a] mb-1.5 tracking-[-0.01em]">
                {agent.title}
              </h3>
              <p className="text-[13px] text-[#64748b] leading-[1.6] mb-5">
                {agent.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {agent.stat > 0 ? (
                  <span className="text-[12px] font-medium text-[#94a3b8]">
                    {agent.stat} {agent.statLabel}
                  </span>
                ) : (
                  <span className="text-[12px] font-medium text-[#94a3b8]">
                    Get started
                  </span>
                )}
                <div className="flex items-center gap-1 text-[#0f172a] opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300">
                  <span className="text-[12px] font-semibold">Open</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-14 text-center">
          <p className="text-[11px] text-[#94a3b8] tracking-wide">
            Press <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] font-mono text-[10px]">1</kbd> - <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] font-mono text-[10px]">5</kbd> to quickly open an agent
          </p>
        </div>
      </main>
    </div>
  )
}
