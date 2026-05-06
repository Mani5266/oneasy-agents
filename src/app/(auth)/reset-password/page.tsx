'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-main)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-navy-100 p-8 shadow-sm">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-700 mb-6">
            <ArrowLeft size={16} /> Back to login
          </Link>

          <h1 className="text-2xl font-bold text-navy-900 mb-2">Reset password</h1>
          <p className="text-sm text-navy-500 mb-6">
            {sent ? 'Check your email for a reset link.' : 'Enter your email to receive a password reset link.'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {sent ? (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              Password reset link sent to <strong>{email}</strong>. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-navy-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
