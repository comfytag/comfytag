'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner, ErrorMessage, Button } from '@comfytag/ui'
import { OrganizerProfileCard } from '@/components/team/OrganizerProfileCard'
import { OnboardingSummary } from '@/components/team/OnboardingSummary'
import { CoOrganizerSection } from '@/components/team/CoOrganizerSection'
import { api } from '@/lib/api'
import { useMyEvents } from '@/hooks/useEvents'
import { useEventTeam, useAddTeamMember, useRemoveTeamMember } from '@/hooks/useTeam'
import type { TeamPermission } from '@/hooks/useTeam'

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

interface UserProfile {
  _id: string
  name: string
  username: string
  avatar?: string | null
  isVerify?: IsVerify
  onboarding?: OnboardingData
}

export default function TeamPage() {
  const { data: session } = useSession()
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // ── User profile ──────────────────────────────────────────────────────────
  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['partnerUser', session?.user.id],
    queryFn: () =>
      api.get<UserProfile>(`/users/${session!.user.id}`).then((r) => r.data),
    enabled: !!session?.user.id,
  })

  // ── Events list (for the event selector in CoOrganizerSection) ───────────
  const { data: events = [], isLoading: eventsLoading } = useMyEvents()

  // ── Team hooks — keyed to the selected event ──────────────────────────────
  const {
    data: members = [],
    isLoading: teamLoading,
    isError: teamError,
  } = useEventTeam(selectedEventId ?? '')

  const addMember = useAddTeamMember()
  const removeMember = useRemoveTeamMember()

  const handleInvite = (email: string, permissions: TeamPermission[]) => {
    if (!selectedEventId) return
    addMember.mutate({ eventId: selectedEventId, email, permissions })
  }

  const handleRemove = (payload: { eventId: string; userId: string }) => {
    removeMember.mutate(payload)
  }

  // Derive a friendly error string from React Query mutation errors
  const inviteError =
    addMember.isError && addMember.error instanceof Error
      ? addMember.error.message
      : null

  if (userLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (userError || !user) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <ErrorMessage message="Failed to load user data." />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, padding: '32px 24px', paddingBottom: '120px' }}>
      <main style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 32px', letterSpacing: '-0.02em' }}>
          TEAM
        </h1>

        <OrganizerProfileCard
          name={user.name}
          username={user.username}
          avatar={user.avatar}
          isVerify={user.isVerify}
        />

        <div style={{ marginBottom: '32px' }}>
          <Link href="/onboarding" style={{ textDecoration: 'none' }}>
            <Button variant="primary" fullWidth>
              Edit Setup
            </Button>
          </Link>
        </div>

        <OnboardingSummary onboarding={user.onboarding} />

        <CoOrganizerSection
          events={events.map((e) => ({ _id: e._id, name: e.name }))}
          eventsLoading={eventsLoading}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          members={members}
          teamLoading={teamLoading}
          teamError={teamError}
          onInvite={handleInvite}
          isInviting={addMember.isPending}
          inviteError={inviteError}
          onRemove={handleRemove}
          isRemoving={removeMember.isPending}
        />
      </main>
    </div>
  )
}
