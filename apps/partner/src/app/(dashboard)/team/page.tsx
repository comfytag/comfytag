'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@comfytag/ui'
import { CrewIdentityCard } from '@/components/team/CrewIdentityCard'
import { CrewMemberCard } from '@/components/team/CrewMemberCard'
import { CrewInviteSection } from '@/components/team/CrewInviteSection'
import { api } from '@/lib/api'
import { useMyEvents } from '@/hooks/useEvents'
import { useEventTeam, useAddTeamMember, useRemoveTeamMember } from '@/hooks/useTeam'
import { useBankAccount } from '@/hooks'
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
  const userId = session?.user?.id ?? ''

  // ── User profile ───────────────────────────────────────────────────────────
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
  } = useQuery({
    queryKey: ['partnerUser', session?.user.id],
    queryFn: () =>
      api.get<UserProfile>(`/users/${session!.user.id}`).then((r) => r.data),
    enabled: !!session?.user.id,
  })

  // ── Events list ────────────────────────────────────────────────────────────
  const { data: events = [], isLoading: eventsLoading } = useMyEvents()

  // ── Team hooks — keyed to the selected event ───────────────────────────────
  const {
    data: members = [],
    isLoading: teamLoading,
    isError: teamError,
  } = useEventTeam(selectedEventId ?? '')

  const addMember = useAddTeamMember()
  const removeMember = useRemoveTeamMember()

  // ── Bank accounts — for identity card status ───────────────────────────────
  const { data: banks = [] } = useBankAccount(userId)

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasBankAccount = banks.some((b) => b.isActive)

  const handleInvite = (email: string, permissions: TeamPermission[]) => {
    if (!selectedEventId) return
    addMember.mutate({ eventId: selectedEventId, email, permissions })
  }

  const handleRemove = (payload: { eventId: string; userId: string }) => {
    removeMember.mutate(payload)
  }

  const inviteError =
    addMember.isError && addMember.error instanceof Error
      ? addMember.error.message
      : null

  const selectedEvent = events.find((e) => e._id === selectedEventId)

  // ── Loading / error guards ─────────────────────────────────────────────────
  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (userError || !user) {
    return (
      <div className="py-8">
        <ErrorMessage message="Failed to load user data." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Crew</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your event team</p>
        </div>

        {/* Event selector */}
        <div className="relative">
          {eventsLoading ? (
            <div className="w-48 h-10 bg-zinc-100 rounded-full animate-pulse" />
          ) : (
            <>
              <select
                value={selectedEventId ?? ''}
                onChange={(e) => setSelectedEventId(e.target.value || null)}
                aria-label="Select event"
                className="appearance-none bg-white border border-zinc-200 shadow-sm rounded-full pl-4 pr-10 py-2.5 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer transition-shadow hover:shadow-md max-w-60 truncate"
              >
                <option value="">Select event…</option>
                {events.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                  </option>
                ))}
              </select>
              {/* Chevron */}
              <svg
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          )}
        </div>
      </div>

      {/* ── YOU Identity Card ── */}
      <CrewIdentityCard
        name={user.name}
        username={user.username}
        avatar={user.avatar}
        isVerify={user.isVerify}
        hasBankAccount={hasBankAccount}
      />

      {/* ── Event-gated content ── */}
      {!selectedEventId ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-10">
          <EmptyState
            title="No event selected"
            subtitle="Use the dropdown above to choose an event and manage its crew."
          />
        </div>
      ) : (
        <>
          {/* ── Crew Members Grid ── */}
          <section aria-label="Crew members">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase whitespace-nowrap">
                · Crew Members ·
              </span>
              <div className="flex-1 h-px bg-zinc-200" />
              {!teamLoading && (
                <span className="text-xs font-semibold text-zinc-400 tabular-nums">
                  {members.length}
                </span>
              )}
            </div>

            {teamLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-zinc-200 rounded-2xl p-5 h-40 animate-pulse"
                  />
                ))}
              </div>
            ) : teamError ? (
              <ErrorMessage message="Failed to load team members." />
            ) : members.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-10">
                <EmptyState
                  title="No crew members yet"
                  subtitle="Invite someone below to start collaborating on this event."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {members.map((member) => (
                  <CrewMemberCard
                    key={member._id}
                    member={member}
                    eventId={selectedEventId}
                    isRemoving={removeMember.isPending}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Invite Section ── */}
          <CrewInviteSection
            eventId={selectedEventId}
            eventName={selectedEvent?.name ?? 'this event'}
            onInvite={handleInvite}
            isInviting={addMember.isPending}
            inviteError={inviteError}
          />
        </>
      )}
    </div>
  )
}
