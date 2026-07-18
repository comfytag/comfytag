'use client'

import { WelcomeCard } from '@/components/layout/WelcomeCard'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <WelcomeCard
      headline="Your event, your stage."
      subtitle="Create an organizer account and start selling tickets in minutes."
    >
      <RegisterForm />
    </WelcomeCard>
  )
}
