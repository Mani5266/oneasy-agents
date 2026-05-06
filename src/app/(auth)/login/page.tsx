'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, FileText, Calculator, Mail, Lock, Eye, EyeOff, Loader2, Phone } from 'lucide-react'

/* Friendly error messages for raw Supabase errors */
function friendlyAuthError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('password should contain'))
    return 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.'
  if (lower.includes('user already registered'))
    return 'An account with this email already exists. Try logging in instead.'
  if (lower.includes('invalid login credentials'))
    return 'Incorrect email or password. Please try again.'
  if (lower.includes('email rate limit') || lower.includes('over_email_send_rate_limit'))
    return 'Too many attempts. Please wait a few minutes and try again.'
  return raw
}

function LoginPageInner() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* Countdown timer for resend OTP */
  useEffect(() => {
    if (countdown <= 0) {
      if (countdownRef.current) clearInterval(countdownRef.current)
      return
    }
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [countdown])

  /* Redirect if already authenticated; read URL params */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: unknown } }) => {
      if (user) {
        try {
          const checkRes = await fetch('/api/networth/check-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          const checkData = await checkRes.json()
          if (checkData.verified) {
            router.replace('/dashboard')
            return
          }
          await supabase.auth.signOut()
        } catch {
          await supabase.auth.signOut()
        }
      }

      const verified = searchParams.get('verified')
      const errorParam = searchParams.get('error')
      if (verified === 'true') setSuccess('Email verified successfully! Please sign in.')
      else if (errorParam === 'expired') setError('Verification link has expired. Please request a new one.')
      else if (errorParam === 'invalid') setError('Invalid verification link. Please request a new one.')

      setChecking(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchTab = (tab: 'login' | 'signup' | 'forgot') => {
    setMode(tab); setError(''); setSuccess(''); setOtpSent(false); setOtp(''); setCountdown(0)
  }

  const toggleLoginMethod = (method: 'email' | 'phone') => {
    setLoginMethod(method); setError(''); setSuccess(''); setOtpSent(false); setOtp(''); setCountdown(0)
  }

  /* Send OTP */
  const handleSendOtp = async () => {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send OTP.')
        setLoading(false)
        return
      }
      setOtpSent(true)
      setCountdown(30)
      setSuccess('OTP sent to your mobile number.')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  /* Verify OTP */
  const handleVerifyOtp = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Verification failed.')
        setLoading(false)
        return
      }
      router.replace('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  /* Email form submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    try {
      if (mode === 'forgot') {
        const res = await fetch('/api/networth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (!res.ok && !data.success) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
        setSuccess('If an account exists with that email, a password reset link has been sent.')
        setLoading(false)
        return
      } else if (mode === 'signup') {
        if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return }

        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) { setError(friendlyAuthError(signUpError.message)); setLoading(false); return }

        if (data.session) await supabase.auth.signOut()

        if (data.user?.id) {
          try {
            await fetch('/api/networth/send-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, userId: data.user.id }),
            })
          } catch { /* non-critical */ }
        }

        setSuccess('Account created! Check your email to verify your account, then come back and login.')
        setPassword(''); setConfirmPassword('')
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) { setError(friendlyAuthError(signInError.message)); setLoading(false); return }

        if (!signInData.user?.id) { await supabase.auth.signOut(); setError('Something went wrong.'); setLoading(false); return }

        try {
          const checkRes = await fetch('/api/networth/check-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          const checkData = await checkRes.json()
          if (!checkData.verified) {
            await supabase.auth.signOut()
            setError('Please verify your email before logging in. Check your inbox for the verification link.')
            setLoading(false)
            return
          }
        } catch {
          await supabase.auth.signOut()
          setError('Unable to verify your account status. Please try again.')
          setLoading(false)
          return
        }

        router.replace('/dashboard')
        return
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <Loader2 size={24} className="animate-spin text-navy-600" />
      </div>
    )
  }

  const isLogin = mode === 'login'
  const isForgot = mode === 'forgot'
  const isPhoneLogin = isLogin && loginMethod === 'phone'

  return (
    <div className="fixed inset-0 flex">
      {/* Left Panel - Dark Navy Brand */}
      <div className="hidden md:flex md:w-[55%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #0b1220 0%, #0f1a2e 50%, #152442 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, #f0b929, #f9d056, #f0b929)' }} />
        <div className="absolute top-20 right-20 w-80 h-80 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #f0b929, transparent)' }} />

        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f0b929, #d9a21e)' }}>
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-white/90 font-semibold text-xl tracking-tight">OnEasy</span>
          </div>

          <h1 className="text-white text-[2.75rem] font-black leading-tight mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            AI Agents<br />Platform
          </h1>
          <p className="text-white/50 text-lg max-w-md mb-12">
            Professional document generation and business tools powered by artificial intelligence.
          </p>

          <div className="space-y-5">
            {[
              { icon: Shield, text: 'Net Worth Certificates' },
              { icon: FileText, text: 'Partnership & LLP Deeds' },
              { icon: Calculator, text: 'Salary Calculations & Offer Letters' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(240, 185, 41, 0.15)' }}>
                  <Icon size={18} style={{ color: '#f0b929' }} />
                </div>
                <span className="text-white/80 text-[15px] font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-sm">&copy; 2026 OnEasy. All rights reserved.</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f0b929, #d9a21e)' }}>
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-semibold text-lg text-navy-900">OnEasy</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-navy-900 mb-1">
            {isForgot ? 'Reset your password' : isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-8">
            {isForgot ? "Enter your email and we'll send you a reset link." : isLogin ? 'Sign in to access your AI agents' : 'Get started with OnEasy AI agents'}
          </p>

          {/* Login/Signup Toggle */}
          {!isForgot && (
            <div className="flex gap-1 p-1 rounded-[var(--radius)] border border-navy-200 mb-6 bg-navy-50/50">
              <button
                onClick={() => switchTab('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isLogin ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-600 hover:text-navy-800'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchTab('signup')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'signup' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-600 hover:text-navy-800'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Login method toggle (only on login tab) */}
          {isLogin && !isForgot && (
            <div className="flex mb-6 gap-2">
              <button
                type="button"
                onClick={() => toggleLoginMethod('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                  loginMethod === 'email'
                    ? 'border-gold-500 bg-gold-500/10 text-gold-700'
                    : 'border-navy-200 text-navy-400 hover:border-navy-300'
                }`}
              >
                <Mail size={16} />
                Email
              </button>
              <button
                type="button"
                onClick={() => toggleLoginMethod('phone')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                  loginMethod === 'phone'
                    ? 'border-gold-500 bg-gold-500/10 text-gold-700'
                    : 'border-navy-200 text-navy-400 hover:border-navy-300'
                }`}
              >
                <Phone size={16} />
                Mobile OTP
              </button>
            </div>
          )}

          {/* Error/Success */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Phone OTP Form */}
          {isPhoneLogin ? (
            <div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="px-4 py-3 bg-navy-50 border border-navy-200 rounded-lg text-navy-500 text-sm font-medium shrink-0">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    autoComplete="tel"
                    className="w-full px-4 py-3 rounded-lg border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500 transition-all"
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || phone.length !== 10}
                  className="w-full py-3 rounded-lg bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-navy-700 mb-1.5">Enter OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                      className="w-full px-4 py-3 rounded-lg border border-navy-200 text-sm text-center tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500 transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                    className="w-full py-3 rounded-lg bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>

                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={countdown > 0 || loading}
                      className="text-sm text-navy-400 hover:text-navy-900 font-medium cursor-pointer hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none"
                    >
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Email Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {!isForgot && (
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-11 py-3 rounded-lg border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500 transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {isLogin && (
                    <div className="flex justify-end mt-1.5">
                      <a onClick={() => switchTab('forgot')} className="text-sm text-gold-600 hover:text-gold-700 font-medium cursor-pointer">
                        Forgot password?
                      </a>
                    </div>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500 transition-all"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Please wait...' : isForgot ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Footer link */}
          <div className="text-center mt-5 text-sm text-navy-400">
            {isForgot ? (
              <>Remember your password?{' '}<a onClick={() => switchTab('login')} className="text-navy-900 font-semibold cursor-pointer hover:underline">Back to Login</a></>
            ) : isLogin ? (
              <>Don&apos;t have an account?{' '}<a onClick={() => switchTab('signup')} className="text-navy-900 font-semibold cursor-pointer hover:underline">Sign up</a></>
            ) : (
              <>Already have an account?{' '}<a onClick={() => switchTab('login')} className="text-navy-900 font-semibold cursor-pointer hover:underline">Login</a></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <Loader2 size={24} className="animate-spin text-navy-600" />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  )
}
