'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, Handshake, FileText, Mail, Calculator, ClipboardList,
  LogOut, ArrowRight, Search, Sparkles, Zap
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
  accentGradient: string
  iconBg: string
  comingSoon?: boolean
}

interface Props {
  user: SupabaseUser | null
  stats: {
    networth: number
    partnership: number
    llp: number
    llpForm: number
    offerLetter: number
    salary: number
  }
}

export default function DashboardClient({ user, stats }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const routes = ['/networth', '/partnership', '/llp', '/offer-letter', '']
      const num = parseInt(e.key)
      if (num >= 1 && num <= 4) router.push(routes[num - 1])
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
      accentColor: '#e63946',
      accentGradient: 'linear-gradient(180deg, #e63946, #9d0208)',
      iconBg: '#fee2e2',
    },
    {
      id: 'partnership',
      title: 'Partnership Deed',
      description: 'Draft partnership deeds with multi-partner support and AI assistance',
      icon: Handshake,
      href: '/partnership',
      stat: stats.partnership,
      statLabel: 'deeds',
      accentColor: '#2563eb',
      accentGradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      iconBg: '#dbeafe',
    },
    {
      id: 'llp-form',
      title: 'LLP Agreement',
      description: 'Generate LLP agreements using a step-by-step form wizard with AI chat',
      icon: ClipboardList,
      href: '/llp-form',
      stat: stats.llpForm,
      statLabel: 'agreements',
      accentColor: '#0891b2',
      accentGradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
      iconBg: '#cffafe',
    },
    {
      id: 'offer-letter',
      title: 'Offer Letter',
      description: 'Create professional offer letters with auto-calculated salary breakdowns',
      icon: Mail,
      href: '/offer-letter',
      stat: stats.offerLetter,
      statLabel: 'offers',
      accentColor: '#7c3aed',
      accentGradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      iconBg: '#ede9fe',
    },
    {
      id: 'salary',
      title: 'Salary Calculator',
      description: 'CTC structuring, payslip generation, tax comparison & statutory compliance',
      icon: Calculator,
      href: '/salary',
      stat: stats.salary,
      statLabel: 'calculations',
      accentColor: '#ea580c',
      accentGradient: 'linear-gradient(135deg, #ea580c, #c2410c)',
      iconBg: '#fed7aa',
      comingSoon: true,
    },
  ]

  const filteredAgents = agents.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleLogout = async () => {
    // Clear sensitive data from localStorage
    try {
      localStorage.removeItem('networth_current_step')
      localStorage.removeItem('networth_chat_map')
      localStorage.removeItem('networth_current_id')
      localStorage.removeItem('networth_resume_data')
      localStorage.removeItem('networth_resume_id')
      localStorage.removeItem('networth_view_only')
      localStorage.removeItem('oneasy_draft')
      localStorage.removeItem('payslip_history')
    } catch {}
    await supabase?.auth.signOut()
    router.push('/login')
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setHoveredCard(id)
  }

  const rawName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  // If the name is just a phone number, show a generic greeting instead
  const userName = /^\d{7,}$/.test(rawName) ? 'there' : rawName
  const totalDocs = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 border-b border-[#EEEEEE]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(180deg, #C80009, #620004)' }}>
              <span className="text-white font-black text-xs">O</span>
            </div>
            <span className="text-[17px] font-bold text-[#0A2640] tracking-[-0.02em]">OnEasy</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] font-medium hover:bg-[#fef2f2] hover:border-[#C80009]/20 hover:text-[#C80009] transition-all duration-200"
              style={{ borderColor: '#E8E8E8', color: '#646464' }}
              title="Sign out"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16 relative">
        {/* Hero Section */}
        <div className="mb-12">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-5"
            style={{ background: '#fff', borderColor: '#E8E8E8', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.5s ease' }}
          >
            <Sparkles size={13} className="text-[#C80009]" />
            <span className="text-[12px] font-semibold text-[#0A2640] tracking-wide uppercase">
              AI Document Platform
            </span>
          </div>
          <h1
            className="text-[2.5rem] font-bold leading-tight tracking-[-0.025em] mb-3"
            style={{ color: '#0A2640', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease 0.1s' }}
          >
            Welcome back, <span style={{ color: '#C80009' }}>{userName}</span>
          </h1>
          <p
            className="text-[15px] leading-relaxed max-w-lg"
            style={{ color: '#646464', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease 0.15s' }}
          >
            Select an agent to generate professional documents.
            {totalDocs > 0 && (
              <span className="inline-flex items-center gap-1 ml-1 font-medium" style={{ color: '#C80009' }}>
                <Zap size={13} />
                {totalDocs} documents generated so far.
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div
          className="relative max-w-sm mb-10"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease 0.2s' }}
        >
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-[13px] placeholder:text-[#888888] focus:outline-none focus:ring-2 transition-all duration-200"
            style={{ borderColor: '#E8E8E8', color: '#0A2640' }}
          />
        </div>

        {/* Agent Cards - Split-tone with colored headers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent, i) => (
            <button
              key={agent.id}
              onClick={() => !agent.comingSoon && router.push(agent.href)}
              onMouseMove={(e) => handleMouseMove(e, agent.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative text-left rounded-2xl border transition-all duration-300 overflow-hidden ${
                agent.comingSoon
                  ? 'cursor-not-allowed opacity-75'
                  : 'hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1.5'
              }`}
              style={{
                borderColor: agent.comingSoon ? '#ea580c40' : '#EEEEEE',
                background: '#FFFFFF',
                opacity: mounted ? (agent.comingSoon ? 0.75 : 1) : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.25 + i * 0.06}s`,
              }}
            >
              {/* Coming Soon badge */}
              {agent.comingSoon && (
                <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)' }}>
                  Coming Soon
                </div>
              )}
              {/* Colored header band */}
              <div
                className="relative px-6 pt-6 pb-5 transition-all duration-300"
                style={{ background: agent.iconBg }}
              >
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-[0.04]" style={{
                  backgroundImage: `radial-gradient(${agent.accentColor} 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }} />

                {/* Mouse glow on header */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: hoveredCard === agent.id
                      ? `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, ${agent.accentColor}15, transparent 70%)`
                      : 'none',
                  }}
                />

                <div className="relative flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 bg-white/80 backdrop-blur-sm"
                    style={{
                      boxShadow: `0 4px 12px -4px ${agent.accentColor}25`,
                    }}
                  >
                    <agent.icon size={22} style={{ color: agent.accentColor }} />
                  </div>

                  {/* Arrow circle */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 bg-white/80"
                    style={{ boxShadow: `0 2px 8px -2px ${agent.accentColor}20` }}
                  >
                    <ArrowRight size={14} style={{ color: agent.accentColor }} />
                  </div>
                </div>
              </div>

              {/* White body */}
              <div className="px-6 py-5">
                <h3 className="text-[15px] font-semibold mb-1.5 tracking-[-0.01em]" style={{ color: '#0A2640' }}>
                  {agent.title}
                </h3>
                <p className="text-[13px] leading-[1.6] mb-4" style={{ color: '#646464' }}>
                  {agent.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#F3F3F3' }}>
                  {agent.comingSoon ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#ea580c' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ea580c' }} />
                      In Progress
                    </span>
                  ) : agent.stat > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#646464' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: agent.accentColor }} />
                      {agent.stat} {agent.statLabel}
                    </span>
                  ) : (
                    <span className="text-[12px] font-medium" style={{ color: '#888888' }}>
                      Get started
                    </span>
                  )}
                  {!agent.comingSoon && (
                    <span className="text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: agent.accentColor }}>
                      Open
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>


      </main>
    </div>
  )
}
