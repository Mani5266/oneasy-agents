'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react'

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
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone')
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

  useEffect(() => {
    if (countdown <= 0) {
      if (countdownRef.current) clearInterval(countdownRef.current)
      return
    }
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); return 0 }
        return c - 1
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [countdown])

  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'signup') setMode('signup')

    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: unknown } }) => {
      if (user) {
        try {
          const checkRes = await fetch('/api/networth/check-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
          const checkData = await checkRes.json()
          if (checkData.verified) { router.replace('/dashboard'); return }
          await supabase.auth.signOut()
        } catch { await supabase.auth.signOut() }
      }
      const verified = searchParams.get('verified')
      const errorParam = searchParams.get('error')
      if (verified === 'true') setSuccess('Email verified successfully! Please sign in.')
      else if (errorParam === 'expired') setError('Verification link has expired.')
      else if (errorParam === 'invalid') setError('Invalid verification link.')
      setChecking(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSendOtp = async () => {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Failed to send OTP.'); setLoading(false); return }
      setOtpSent(true); setCountdown(30); setSuccess('OTP sent to your mobile number.')
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  const handleVerifyOtp = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp }) })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || 'Verification failed.'); setLoading(false); return }
      router.replace('/dashboard')
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return }
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) { setError(friendlyAuthError(signUpError.message)); setLoading(false); return }
        if (data.session) await supabase.auth.signOut()
        if (data.user?.id) {
          try { await fetch('/api/networth/send-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, userId: data.user.id }) }) } catch {}
        }
        setSuccess('Account created! Check your email to verify, then sign in.')
        setPassword(''); setConfirmPassword('')
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) { setError(friendlyAuthError(signInError.message)); setLoading(false); return }
        if (!signInData.user?.id) { await supabase.auth.signOut(); setError('Something went wrong.'); setLoading(false); return }
        try {
          const checkRes = await fetch('/api/networth/check-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
          const checkData = await checkRes.json()
          if (!checkData.verified) { await supabase.auth.signOut(); setError('Please verify your email before logging in.'); setLoading(false); return }
        } catch { await supabase.auth.signOut(); setError('Unable to verify account status.'); setLoading(false); return }
        router.replace('/dashboard')
      }
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })
    if (error) setError(error.message)
  }

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0A2640' }}>
        <Loader2 size={24} className="animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #0A2640 0%, #0d3050 100%)' }}>
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-dm-serif)' }}>
          <span className="text-white">On</span>
          <span className="text-[#C80009]">E</span>
          <span className="text-white">asy</span>
          <span className="text-white/60 text-lg align-top">&#8482;</span>
        </h1>
      </div>

      {/* White Card */}
      <div className="relative z-10 w-full max-w-[460px] bg-white rounded-2xl shadow-2xl p-8 md:p-10">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-1" style={{ fontFamily: 'var(--font-dm-serif)', fontStyle: 'italic' }}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          {mode === 'login' ? 'Sign In to your account' : 'Sign up for a new account'}
        </p>

        {/* Error/Success */}
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>}

        {/* Phone / Email Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setLoginMethod('phone'); setError(''); setSuccess(''); setOtpSent(false); setOtp('') }}
            className={`flex-1 pb-3 text-sm font-medium transition-all border-b-2 ${
              loginMethod === 'phone' ? 'border-[#0A2640] text-[#0A2640]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Phone Number
          </button>
          <button
            onClick={() => { setLoginMethod('email'); setError(''); setSuccess('') }}
            className={`flex-1 pb-3 text-sm font-medium transition-all border-b-2 ${
              loginMethod === 'email' ? 'border-[#0A2640] text-[#0A2640]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Email Id
          </button>
        </div>

        {/* Phone Form */}
        {loginMethod === 'phone' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="flex gap-2 mb-5">
              <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium shrink-0 flex items-center">
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter your Phone Number"
                maxLength={10}
                autoComplete="tel"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2640]/20 focus:border-[#0A2640] transition-all"
              />
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || phone.length !== 10}
                className="w-full py-3.5 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0A2640 0%, #153d5e 100%)' }}
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-center tracking-[0.3em] font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-[#0A2640]/20 focus:border-[#0A2640] transition-all"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3.5 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #0A2640 0%, #153d5e 100%)' }}
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={countdown > 0 || loading}
                    className="text-sm text-gray-400 hover:text-[#0A2640] font-medium cursor-pointer hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none"
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Email Form */
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2640]/20 focus:border-[#0A2640] transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-11 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2640]/20 focus:border-[#0A2640] transition-all"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2640]/20 focus:border-[#0A2640] transition-all"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0A2640 0%, #153d5e 100%)' }}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Or divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">Or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social Sign-In */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </button>

        </div>

        {/* Mode switch */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {mode === 'login' ? (
            <>Don&apos;t have an account?{' '}<button onClick={() => { setMode('signup'); setError(''); setSuccess('') }} className="text-[#0A2640] font-semibold hover:underline bg-transparent border-none cursor-pointer">Sign up</button></>
          ) : (
            <>Already have an account?{' '}<button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-[#0A2640] font-semibold hover:underline bg-transparent border-none cursor-pointer">Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0A2640' }}>
        <Loader2 size={24} className="animate-spin text-white" />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  )
}
