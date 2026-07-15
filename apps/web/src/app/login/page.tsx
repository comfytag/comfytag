'use client'

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm'

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const didReset = searchParams.get('success') === '1'
  const didRegister = searchParams.get('registered') === 'true'
  const registeredEmail = searchParams.get('email') ?? ''

  // Unverified-login lands here instead of navigating away, mirroring
  // AuthModal's view switch — this page used to redirect to /verify-email
  // with an ?email= param, but that route only understands ?token=
  // (the magic-link flow) and would show a dead-end error.
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)
  const [verifyCodeAlreadySent, setVerifyCodeAlreadySent] = useState(false)
  const [pendingMode, setPendingMode] = useState<'otp' | 'credentials'>('otp')
  const [pendingEmail, setPendingEmail] = useState('')

  if (verifyEmail) {
    return (
      <AuthLayout>
        <VerifyEmailForm
          email={verifyEmail}
          callbackUrl={callbackUrl}
          onSuccess={() => { router.push(callbackUrl); router.refresh() }}
          onBack={() => setVerifyEmail(null)}
          onRequiresPassword={(email) => {
            setVerifyEmail(null)
            setPendingEmail(email)
            setPendingMode('credentials')
          }}
          codeAlreadySent={verifyCodeAlreadySent}
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <LoginForm
        onSwitchToRegister={() => router.push('/register')}
        onSwitchToForgotPassword={() => router.push('/forgot-password')}
        onSwitchToVerifyEmail={(email, codeAlreadySent) => { setVerifyEmail(email); setVerifyCodeAlreadySent(!!codeAlreadySent) }}
        callbackUrl={callbackUrl}
        initialEmail={pendingEmail || registeredEmail}
        initialMode={pendingMode}
        successBanner={didRegister ? 'registered' : didReset ? 'password-reset' : null}
      />
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
