'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { OrganizerCard } from '@/components/ui/OrganizerCard'
import type { OrganizerStats } from '@/components/ui/OrganizerCard'
import { EventCard } from '@/components/ui/EventCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { TabBar } from '@/components/ui/TabBar'
import { useAuthGate } from '@/hooks/useAuthGate'
import { Button, EmptyState } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { useOrganizerProfile, useFollowOrganizer, useLikeEvent } from '@/hooks/useEvents'

type ActiveTab = 'upcoming' | 'past'

interface InitialProfile {
  organizer: {
    _id: string
    name: string
    bio?: string
    image?: string
    avatar?: string
  }
  stats?: {
    eventCount: number
    followerCount: number
    totalTicketsSold: number
  }
  events: Event[]
  isFollowing?: boolean
}

export function OrganizerClient({ slug, initialProfile }: { slug: string; initialProfile: InitialProfile }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const { data: organizer = initialProfile?.organizer } = useOrganizerProfile(slug)
  const { mutate: followMutate } = useFollowOrganizer()
  const { mutate: likeMutate } = useLikeEvent()

  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming')
  const [unfollowSheetOpen, setUnfollowSheetOpen] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [followHovered, setFollowHovered] = useState(false)
  // isFollowing is tracked locally so it stays in sync after mutations.
  // The getUser endpoint doesn't return a per-viewer isFollowing field;
  // useFollowOrganizer.onSuccess merges it into the cache but we also
  // need it reflected immediately without waiting for a re-render cycle.
  const [isFollowing, setIsFollowing] = useState(initialProfile?.isFollowing ?? false)

  const { gateOpen, closeGate, openGate } = useAuthGate()

  async function handleFollow() {
    if (status !== 'authenticated' || !session) {
      router.push('/login')
      return
    }
    if (!organizer?._id) return
    followMutate(
      { organizerId: organizer._id, slug },
      { onSuccess: (data: { following: boolean }) => setIsFollowing(data.following) }
    )
  }

  async function handleUnfollowConfirm() {
    if (status !== 'authenticated' || !session) {
      router.push('/login')
      return
    }
    if (!organizer?._id) return
    followMutate(
      { organizerId: organizer._id, slug },
      { onSuccess: (data: { following: boolean }) => setIsFollowing(data.following) }
    )
    setUnfollowSheetOpen(false)
  }

  async function handleLike(eventId: string) {
    if (!session) {
      openGate('like')
      return
    }
    const eventSlug = events.find((e: Event) => e._id === eventId)?.slug ?? eventId
    likeMutate({ eventId, slug: eventSlug })
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  // Organizer data from hook
  const organizerName = organizer?.name ?? 'Organizer'
  // Stats are embedded in the getUser response; followerCount/eventCount/totalTicketsSold
  // are flat integers. Fallback to array-length for any legacy shape.
  const followerCount = organizer?.followerCount ?? organizer?.followers?.length ?? 0
  const eventCount = organizer?.eventCount ?? 0
  const totalTicketsSold = organizer?.totalTicketsSold ?? 0

  // Events from organizer object
  const events: Event[] = organizer?.events ?? []

  const now = new Date()

  const upcomingEvents = events
    .filter((e: Event) => new Date(e.date || 0) >= now)
    .sort((a: Event, b: Event) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())

  const pastEvents = events
    .filter((e: Event) => new Date(e.date || 0) < now)
    .sort((a: Event, b: Event) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  const tabEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents

  const allRecapPhotos = pastEvents.flatMap((e: Event) => e.recapPhotos ?? []).slice(0, 12)

  return (
    <>
      <AuthGateSheet isOpen={gateOpen} onClose={closeGate} trigger="like" />

      <BottomSheet
        isOpen={unfollowSheetOpen}
        onClose={() => setUnfollowSheetOpen(false)}
        title={`Unfollow ${organizerName}?`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            You will no longer see updates from this organizer in your feed.
          </p>
          <Button variant="danger" size="md" onClick={handleUnfollowConfirm}>
            Unfollow
          </Button>
          <Button variant="ghost" size="md" onClick={() => setUnfollowSheetOpen(false)}>
            Cancel
          </Button>
        </div>
      </BottomSheet>

      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Organizer profile card — button rendered separately below */}
        <div style={{ marginTop: '24px', marginBottom: '12px' }}>
          <OrganizerCard
            variant="profile"
            organizer={{
              _id: organizer?._id ?? slug,
              name: organizerName,
              image: organizer?.avatar ?? organizer?.image,
              isPartner: organizer?.isPartner ?? true,
              isVerify: organizer?.isVerify ?? {},
            }}
            stats={{
              followerCount,
              eventCount,
              totalTicketsSold,
            }}
            isFollowing={isFollowing}
          />
        </div>

        {/* ── Follow CTA — three-state state machine ─────────────────────────
            A: not following  → "Follow"     — brand purple solid
            B: following      → "Following"  — ghost / low contrast
            C: following+hover→ "Unfollow"   — crimson outline warning
        ──────────────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: organizer?.bio ? '12px' : '24px' }}>
          <button
            onClick={() => {
              if (!isFollowing) {
                handleFollow()
              } else {
                setUnfollowSheetOpen(true)
              }
            }}
            onMouseEnter={() => setFollowHovered(true)}
            onMouseLeave={() => setFollowHovered(false)}
            aria-pressed={isFollowing}
            aria-label={
              isFollowing
                ? followHovered ? 'Unfollow this organizer' : 'Following this organizer'
                : 'Follow this organizer'
            }
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background var(--duration-fast) ease, border-color var(--duration-fast) ease, color var(--duration-fast) ease',
              ...(isFollowing
                ? followHovered
                  ? {
                      // Condition C — "Unfollow" warning
                      background: 'rgba(239, 68, 68, 0.06)',
                      border: '1.5px solid rgba(239, 68, 68, 0.5)',
                      color: '#EF4444',
                    }
                  : {
                      // Condition B — "Following" ghost
                      background: 'transparent',
                      border: '1.5px solid var(--color-border)',
                      color: 'var(--color-text-muted)',
                    }
                : {
                    // Condition A — "Follow" brand
                    background: 'var(--color-brand)',
                    border: '1.5px solid var(--color-brand)',
                    color: 'var(--color-text-on-brand)',
                  }),
            }}
          >
            {isFollowing ? (followHovered ? 'Unfollow' : 'Following') : 'Follow'}
          </button>
        </div>

        {organizer?.bio && (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}
          >
            {organizer.bio}
          </p>
        )}

        <TabBar
          tabs={[
            { label: 'Upcoming', value: 'upcoming', count: upcomingEvents.length },
            { label: 'Past', value: 'past', count: pastEvents.length },
          ]}
          activeTab={activeTab}
          onChange={(value) => setActiveTab(value as ActiveTab)}
          variant="underline"
        />

        {/* Recap photo gallery (Past tab only) */}
        {activeTab === 'past' && allRecapPhotos.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>Recap Gallery</h2>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {allRecapPhotos.map((url: string, i: number) => (
                <img
                  key={url + i}
                  src={url}
                  alt={`Event recap ${i + 1}`}
                  width={160}
                  height={120}
                  style={{ flexShrink: 0, width: 160, height: 120, objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}

        {/* Event grid */}
        {tabEvents.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {tabEvents.map((event: Event) => (
              <EventCard
                key={event._id}
                event={event}
                href={`/events/${event.slug ?? event._id}`}
                isLiked={likedIds.has(event._id)}
                onLike={handleLike}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={activeTab === 'upcoming' ? 'No upcoming events' : 'No past events yet'}
            subtitle={
              activeTab === 'upcoming'
                ? 'Check back soon for new events from this organizer.'
                : 'This organizer has no past events.'
            }
          />
        )}
      </div>
    </>
  )
}
