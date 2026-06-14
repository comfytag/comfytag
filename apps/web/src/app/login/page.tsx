'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const didReset = searchParams.get('success') === '1'
  const didRegister = searchParams.get('registered') === 'true'
  const registeredEmail = searchParams.get('email') ?? ''

  return (
    <AuthLayout>
      <LoginForm
        onSwitchToRegister={() => router.push('/register')}
        onSwitchToForgotPassword={() => router.push('/forgot-password')}
        callbackUrl={callbackUrl}
        initialEmail={registeredEmail}
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
