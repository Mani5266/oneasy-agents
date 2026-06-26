'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ─── Scroll-aware Navbar (client) ─── */
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Best-effort auth check — fails silently if Supabase unreachable.
  // Default state (loggedIn=false) shows Login/Sign Up, which is the safe fallback.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        if (!supabase) return
        const { data } = await supabase.auth.getUser()
        if (!cancelled && data?.user) setLoggedIn(true)
      } catch {
        // Supabase unreachable — keep loggedIn=false
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
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
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="btn-press px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-lg shadow-red-900/30"
                style={{ background: 'linear-gradient(180deg, #C80009 0%, #620004 100%)' }}
              >
                Dashboard
              </Link>
            ) : (
              <>
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
              </>
            )}
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
            {loggedIn ? (
              <Link href="/dashboard" className="flex-1 text-center py-2.5 text-sm text-white rounded-lg" style={{ background: 'linear-gradient(180deg, #C80009 0%, #620004 100%)' }} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="flex-1 text-center py-2.5 text-sm text-white border border-white/30 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link href="/login?mode=signup" className="flex-1 text-center py-2.5 text-sm text-white rounded-lg" style={{ background: 'linear-gradient(180deg, #C80009 0%, #620004 100%)' }} onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

/* ─── Reveal wrapper (intersection observer) ─── */
export function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
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

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
