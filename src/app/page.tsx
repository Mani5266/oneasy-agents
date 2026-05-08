'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Shield, FileText, Calculator, Users, Briefcase, ChevronRight, Menu, X, Check, Star, ArrowRight, Zap, Clock, Lock, BarChart3 } from 'lucide-react'

/* ─── Intersection Observer Hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            // Also reveal staggered children
            const children = entry.target.querySelectorAll('.reveal')
            children.forEach((child, i) => {
              ;(child as HTMLElement).style.setProperty('--i', String(i))
              setTimeout(() => child.classList.add('revealed'), i * 100)
            })
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}

/* ─── Data ─── */
const agents = [
  {
    title: 'Net Worth Certificate',
    description: 'Generate professional net worth certificates with AI-powered asset and liability analysis for individuals and businesses.',
    icon: Shield,
    features: ['Automated asset valuation', 'Liability computation', 'CA-ready format', 'Multi-format export'],
  },
  {
    title: 'Partnership Deed',
    description: 'Draft comprehensive partnership deeds with customizable clauses, profit-sharing ratios, and partner configurations.',
    icon: Users,
    features: ['Smart clause generation', 'Partner role mapping', 'Profit-sharing logic', 'Stamp duty ready'],
  },
  {
    title: 'LLP Agreement',
    description: 'Create LLP agreements with intelligent clause generation, compliance checks, and MCA-ready formatting.',
    icon: Briefcase,
    features: ['MCA compliant drafts', 'Clause library', 'Capital contribution', 'Rights & obligations'],
  },
  {
    title: 'Offer Letter',
    description: 'Generate professional offer letters with salary breakdowns, company branding, and customizable templates.',
    icon: FileText,
    features: ['CTC breakdown', 'Company branding', 'Multiple templates', 'PDF generation'],
  },
  {
    title: 'Salary Calculator',
    description: 'Calculate CTC breakdowns, generate payslips, and manage salary structures with tax optimization.',
    icon: Calculator,
    features: ['CTC to in-hand calc', 'Tax optimization', 'Payslip generation', 'PF & ESI handling'],
  },
]

const stats = [
  { value: '10,000+', label: 'Documents Generated' },
  { value: '99.9%', label: 'Accuracy Rate' },
  { value: '< 2 min', label: 'Average Generation Time' },
  { value: '500+', label: 'Happy Businesses' },
]

const whyChooseUs = [
  { icon: Zap, title: 'AI-Powered Speed', desc: 'Generate complex legal documents in under 2 minutes with our advanced AI engine.' },
  { icon: Shield, title: 'Zero Error Guarantee', desc: 'Every document passes through multiple validation layers for 99.9% accuracy.' },
  { icon: Clock, title: 'Available 24/7', desc: 'No more waiting for office hours. Generate documents anytime, anywhere.' },
  { icon: Lock, title: 'Bank-Grade Security', desc: 'Your data is encrypted end-to-end. We never share or sell your information.' },
  { icon: BarChart3, title: 'Compliance Ready', desc: 'All documents follow latest regulatory standards — MCA, Income Tax, GST compliant.' },
  { icon: Star, title: 'Transparent Pricing', desc: 'No hidden fees. Pay only for what you use with clear, upfront pricing.' },
]

/* ─── Component ─── */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const servicesRef = useReveal()
  const whyUsRef = useReveal()
  const aboutRef = useReveal()
  const ctaRef = useReveal()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* ─── NAVBAR ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-black/90 backdrop-blur-xl shadow-2xl shadow-black/10' : 'bg-gradient-to-r from-black/40 via-slate-900/40 to-black/40 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-1 group">
              <span className="text-2xl font-bold tracking-tight transition-transform duration-300 group-hover:scale-105" style={{ fontFamily: 'var(--font-dm-serif)' }}>
                <span className="text-white">On</span>
                <span className="text-[#C80009]">E</span>
                <span className="text-white">asy</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['Services', 'Why Us', 'About'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="relative text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C80009] group-hover:w-full transition-all duration-400 ease-out" />
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-300">
                Login
              </Link>
              <Link
                href="/login?mode=signup"
                className="btn-press px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-lg shadow-red-900/30"
                style={{ background: 'linear-gradient(180deg, #C80009 0%, #620004 100%)' }}
              >
                Get Started
              </Link>
            </div>

            <button className="md:hidden text-white p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 space-y-3 animate-fade-in-up">
            {['Services', 'Why Us', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="block text-white/80 hover:text-white text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                {item}
              </a>
            ))}
            <div className="pt-3 border-t border-white/10 flex gap-3">
              <Link href="/login" className="flex-1 text-center py-2.5 text-sm text-white border border-white/30 rounded-lg">Login</Link>
              <Link href="/login?mode=signup" className="flex-1 text-center py-2.5 text-sm text-white rounded-lg" style={{ background: 'linear-gradient(180deg, #C80009 0%, #620004 100%)' }}>Sign Up</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0A2640]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] glow-pulse" style={{ background: 'radial-gradient(circle, #C80009, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] glow-pulse glow-pulse-delay" style={{ background: 'radial-gradient(circle, #1e40af, transparent)' }} />
        {/* Floating decorative elements */}
        <div className="absolute top-[20%] right-[15%] w-3 h-3 rounded-full bg-white/20 float" />
        <div className="absolute top-[40%] left-[10%] w-2 h-2 rounded-full bg-red-400/30 float float-delay-1" />
        <div className="absolute bottom-[30%] right-[25%] w-4 h-4 rounded-full bg-blue-400/10 float float-delay-2" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.15] mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/70 font-medium">Trusted by 500+ businesses across India</span>
          </div>

          <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            Every business document,<br />
            <span className="shimmer-text">powered by AI</span>
          </h1>

          <p className="hero-subtitle text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Generate net worth certificates, partnership deeds, LLP agreements, offer letters, and salary calculations in minutes — not days.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login?mode=signup"
              className="btn-press inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl shadow-xl shadow-red-900/30"
              style={{ background: 'linear-gradient(180deg, #C80009 0%, #620004 100%)' }}
            >
              Start Generating Free <ArrowRight size={18} />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-white/70 rounded-xl border border-white/[0.15] hover:bg-white/[0.05] hover:border-white/30 transition-all duration-300"
            >
              Explore Agents
            </a>
          </div>

          {/* Stats */}
          <div className="hero-stats grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center group" style={{ animationDelay: `${1.2 + i * 0.1}s` }}>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 transition-transform duration-300 group-hover:scale-110">{stat.value}</div>
                <div className="text-xs sm:text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ─── SERVICES / AGENTS ─── */}
      <section id="services" className="py-20 sm:py-28 bg-white">
        <div ref={servicesRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal reveal-up">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[#C80009] mb-3">Our AI Agents</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A2640] mb-4" style={{ fontFamily: 'var(--font-dm-serif)' }}>
              Professional Documents,<br className="hidden sm:block" /> Zero Effort
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              Each AI agent is purpose-built to generate specific business documents with accuracy, speed, and compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal-stagger">
            {agents.map((agent, i) => (
              <div
                key={agent.title}
                className="reveal reveal-up group relative bg-white rounded-2xl p-8 border border-gray-100 card-hover gradient-border"
                style={{ '--i': i } as React.CSSProperties}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-red-50 group-hover:bg-red-100 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <agent.icon size={26} className="text-[#C80009]" />
                </div>

                <h3 className="text-xl font-bold text-[#0A2640] mb-2 group-hover:text-[#C80009] transition-colors duration-300">{agent.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{agent.description}</p>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {agent.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 rounded-md px-2.5 py-1.5 group-hover:bg-red-50/50 transition-colors duration-300">
                      <Check size={12} className="text-[#C80009] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/login"
                  className="btn-press w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-lg shadow-lg shadow-red-900/20"
                  style={{ background: 'linear-gradient(180deg, #C80009 0%, #620004 100%)' }}
                >
                  Try Now <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section id="why-us" className="py-20 sm:py-28" style={{ background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)' }}>
        <div ref={whyUsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal reveal-up">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[#C80009] mb-3">Excellence</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A2640] mb-4" style={{ fontFamily: 'var(--font-dm-serif)' }}>
              Why Choose Us?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-base">
              Built by CAs, powered by AI. We combine domain expertise with cutting-edge technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stagger">
            {whyChooseUs.map((item, i) => (
              <div
                key={item.title}
                className="reveal reveal-up flex gap-4 p-6 rounded-xl hover:bg-white hover:shadow-xl transition-all duration-500 group cursor-default"
                style={{ '--i': i } as React.CSSProperties}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 group-hover:bg-[#C80009] transition-all duration-300 shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-red-200">
                  <item.icon size={22} className="text-[#C80009] group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A2640] mb-1 group-hover:text-[#C80009] transition-colors duration-300">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT / MISSION ─── */}
      <section id="about" className="py-20 sm:py-28 bg-white">
        <div ref={aboutRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal reveal-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[#C80009] mb-3">About OnEasy</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0A2640] mb-6" style={{ fontFamily: 'var(--font-dm-serif)' }}>
                Guiding your business forward with AI
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                OnEasy is building the future of business document generation. We believe every entrepreneur deserves access to professional-grade legal and financial documents — without the wait, without the cost, and without the complexity.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                Our AI agents are trained on thousands of real-world documents, validated by chartered accountants, and designed to be compliant with Indian regulatory standards from day one.
              </p>
              <div className="flex flex-wrap gap-8">
                {[
                  { value: '5+', label: 'AI Agents' },
                  { value: '10K+', label: 'Documents' },
                  { value: '100%', label: 'Compliant' },
                ].map((s) => (
                  <div key={s.label} className="text-center group cursor-default">
                    <div className="text-2xl font-bold text-[#0A2640] transition-transform duration-300 group-hover:scale-110">{s.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl glow-pulse" style={{ background: 'linear-gradient(135deg, #C80009, #0A2640)' }} />
              <div className="relative bg-[#0A2640] rounded-2xl p-10 text-white overflow-hidden group hover:shadow-2xl transition-shadow duration-500">
                {/* Subtle inner pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }} />
                <div className="relative z-10">
                  <div className="text-5xl mb-4 opacity-30 group-hover:opacity-60 transition-opacity duration-500" style={{ fontFamily: 'var(--font-dm-serif)' }}>&ldquo;</div>
                  <p className="text-lg leading-relaxed text-white/80 mb-6" style={{ fontFamily: 'var(--font-dm-serif)', fontStyle: 'italic' }}>
                    To be the most trusted partner for startups and SMEs in India, inspiring a generation of financially literate, growth-focused entrepreneurs.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(180deg, #C80009 0%, #620004 100%)' }}>
                      <span className="text-white font-bold text-sm">O</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">OnEasy</div>
                      <div className="text-white/50 text-xs">Our Mission</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[#0A2640]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px] glow-pulse" style={{ background: 'radial-gradient(circle, #C80009, transparent)' }} />

        <div ref={ctaRef} className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal reveal-scale">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-dm-serif)' }}>
            Ready to transform how you<br className="hidden sm:block" /> create business documents?
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-2xl mx-auto">
            Join 500+ businesses already using OnEasy AI agents to generate professional documents in minutes.
          </p>
          <Link
            href="/login?mode=signup"
            className="btn-press inline-flex items-center gap-2 px-10 py-4 text-base font-semibold text-white rounded-xl shadow-2xl shadow-red-900/40"
            style={{ background: 'linear-gradient(180deg, #C80009 0%, #620004 100%)' }}
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0A2640] border-t border-white/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="mb-4">
                <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-dm-serif)' }}>
                  <span className="text-white">On</span>
                  <span className="text-[#C80009]">E</span>
                  <span className="text-white">asy</span>
                </span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                AI-powered business document generation platform. Professional, compliant, and fast.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5">
                {['About Us', 'Why Choose Us', 'Pricing', 'Contact Us'].map((item) => (
                  <li key={item}><a href="#" className="text-white/40 text-sm hover:text-white/80 transition-colors duration-300">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Services</h4>
              <ul className="space-y-2.5">
                {['Net Worth Certificate', 'Partnership Deed', 'LLP Agreement', 'Offer Letter', 'Salary Calculator'].map((item) => (
                  <li key={item}><a href="#" className="text-white/40 text-sm hover:text-white/80 transition-colors duration-300">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Resources</h4>
              <ul className="space-y-2.5">
                {['Privacy Policy', 'Terms & Conditions', 'Refund Policy', 'Blog'].map((item) => (
                  <li key={item}><a href="#" className="text-white/40 text-sm hover:text-white/80 transition-colors duration-300">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">&copy; 2026 OnEasy. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="mailto:hello@oneasy.ai" className="text-white/40 text-sm hover:text-white/80 transition-colors duration-300">hello@oneasy.ai</a>
              <span className="text-white/20">|</span>
              <a href="tel:+918121750505" className="text-white/40 text-sm hover:text-white/80 transition-colors duration-300">+91 8121750505</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
