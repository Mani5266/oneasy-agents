'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [supabase])

  const handleResend = async () => {
    setResending(true)
    await supabase.auth.resend({ type: 'signup', email })
    setResent(true)
    setResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-main)' }}>
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl border border-navy-100 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center mx-auto mb-5">
            <Mail size={28} className="text-gold-600" />
          </div>

          <h1 className="text-2xl font-bold text-navy-900 mb-2">Verify your email</h1>
          <p className="text-sm text-navy-500 mb-6">
            We sent a verification link to<br />
            <strong className="text-navy-700">{email || 'your email'}</strong>
          </p>

          {resent ? (
            <div className="flex items-center justify-center gap-2 text-green-600 text-sm mb-6">
              <CheckCircle size={16} /> Email resent successfully
            </div>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-gold-600 hover:text-gold-700 font-medium mb-6 inline-flex items-center gap-1.5"
            >
              {resending && <Loader2 size={14} className="animate-spin" />}
              Resend verification email
            </button>
          )}

          <div className="border-t border-navy-100 pt-5">
            <Link href="/login" className="text-sm text-navy-500 hover:text-navy-700 font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
