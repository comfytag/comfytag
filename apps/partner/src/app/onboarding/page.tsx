'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { WelcomeCard } from '@/components/layout/WelcomeCard'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { api } from '@/lib/api'

interface User {
  _id: string
  name: string
  onboarding?: {
    experience?: string
    team?: string
    event_per_year?: string
    event_turnout?: string
    interest?: string[]
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && !session.user.isPartner && !session.user.isAdmin) {
      router.replace('/login')
    }
  }, [status, session, router])

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['partnerUser', session?.user.id],
    queryFn: () =>
      api.get<User>(`/users/${session!.user.id}`).then((r) => r.data),
    enabled: !!session?.user.id,
  })

  return (
    <WelcomeCard
      headline="Let's get you set up."
      subtitle="A few quick questions so we can tailor your dashboard to how you run events."
      maxWidth="640px"
    >
      {isLoading ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <LoadingSpinner centered size="lg" />
        </div>
      ) : isError ? (
        <ErrorMessage message="Failed to load your account. Please refresh and try again." />
      ) : (
        <OnboardingWizard initialData={user?.onboarding} />
      )}
    </WelcomeCard>
  )
}
