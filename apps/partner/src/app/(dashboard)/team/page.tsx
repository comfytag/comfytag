'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner, ErrorMessage, Button } from '@comfytag/ui'
import { OrganizerProfileCard } from '@/components/team/OrganizerProfileCard'
import { OnboardingSummary } from '@/components/team/OnboardingSummary'
import { CoOrganizerSection } from '@/components/team/CoOrganizerSection'
import api, { authHeader } from '@/lib/api'

interface IsVerify {
  email?: boolean
  photo?: boolean
  idCard?: boolean
  address?: boolean
}

interface OnboardingData {
  experience?: string
  team?: string
  event_per_year?: string
  event_turnout?: string
  interest?: string[]
}

interface User {
  _id: string
  name: string
  username: string
  avatar?: string | null
  isVerify?: IsVerify
  onboarding?: OnboardingData
}

export default function TeamPage() {
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

  if (isError || !user) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <ErrorMessage message="Failed to load user data." />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, padding: '32px 24px', paddingBottom: '120px' }}>
      <main style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Page Title */}
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 32px', letterSpacing: '-0.02em' }}>
          TEAM
        </h1>

        {/* Organizer Profile Card */}
        <OrganizerProfileCard
          name={user.name}
          username={user.username}
          avatar={user.avatar}
          isVerify={user.isVerify}
        />

        {/* Edit Setup Button */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/onboarding" style={{ textDecoration: 'none' }}>
            <Button variant="primary" fullWidth>
              Edit Setup
            </Button>
          </Link>
        </div>

        {/* Onboarding Summary */}
        <OnboardingSummary onboarding={user.onboarding} />

        {/* Co-organizer Section */}
        <CoOrganizerSection />
      </main>
    </div>
  )
}
