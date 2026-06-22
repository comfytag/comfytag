'use client'

import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  const router = useRouter()

  return (
    <AuthLayout>
      <ForgotPasswordForm
        onSwitchToLogin={() => router.push('/login')}
        onPasswordReset={() => router.push('/login?success=1')}
      />
    </AuthLayout>
  )
}
