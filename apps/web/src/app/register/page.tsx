'use client'

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm'

function RegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  // register() already sends a verification code — go straight to entering
  // it instead of bouncing through /login (which would require another
  // "Send code" click that reissues and invalidates this one).
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)

  if (verifyEmail) {
    return (
      <AuthLayout>
        <VerifyEmailForm
          email={verifyEmail}
          callbackUrl={callbackUrl}
          onSuccess={() => { router.push(callbackUrl); router.refresh() }}
          onBack={() => setVerifyEmail(null)}
          codeAlreadySent
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <RegisterForm
        onSwitchToLogin={() => router.push('/login')}
        onSuccess={(email) => setVerifyEmail(email)}
        callbackUrl={callbackUrl}
      />
    </AuthLayout>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  )
}
