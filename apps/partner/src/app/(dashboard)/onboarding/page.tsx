'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import api, { authHeader } from '@/lib/api'

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
  const { data: session } = useSession()
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['partnerUser', session?.user.id],
    queryFn: () =>
      api.get<User>(`/users/${session!.user.id}`, authHeader(session?.user.token)).then((r) => r.data),
    enabled: !!session?.user.id,
  })

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <ErrorMessage message="Failed to load user data." />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, padding: '32px 24px', paddingBottom: '120px' }}>
      <OnboardingWizard initialData={user?.onboarding} />
    </div>
  )
}
