'use client'

import { Suspense } from 'react'
import { WelcomeCard } from '@/components/layout/WelcomeCard'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <WelcomeCard
      headline="Run bigger events."
      subtitle="Sign in to manage your events, payouts, and team."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </WelcomeCard>
  )
}
