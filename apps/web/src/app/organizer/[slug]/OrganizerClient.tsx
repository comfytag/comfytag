'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { OrganizerCard } from '@/components/ui/OrganizerCard'
import type { OrganizerStats } from '@/components/ui/OrganizerCard'
import { EventCard } from '@/components/ui/EventCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { TabBar } from '@/components/ui/TabBar'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { useAuthGate } from '@/hooks/useAuthGate'
import { Button, EmptyState } from '@comfytag/ui'
import { isUpcoming } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import { api } from '@/lib/api'
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
  const { data: session } = useSession()

  const { data: organizer = initialProfile?.organizer } = useOrganizerProfile(slug)
  const { mutate: followMutate } = useFollowOrganizer()
  const { mutate: likeMutate } = useLikeEvent()

  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming')
  const [unfollowSheetOpen, setUnfollowSheetOpen] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const { gateOpen, closeGate, openGate } = useAuthGate()

  async function handleFollow() {
    if (!session) {
      openGate('like')
      return
    }
    followMutate({ slug })
  }

  async function handleUnfollowConfirm() {
    followMutate({ slug })
    setUnfollowSheetOpen(false)
  }

  async function handleLike(eventId: string) {
    if (!session) {
      openGate('like')
      return
    }
    likeMutate({ eventId, slug })
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  // Organizer data from hook
  const organizerName = organizer?.name ?? 'Organizer'
  const isFollowing = organizer?.isFollowing ?? false
  const followerCount = organizer?.followers?.length ?? 0

  // Events from organizer object
  const events: Event[] = organizer?.events ?? []
  const stats = organizer?.stats

  const upcomingEvents = events
    .filter((e: Event) => isUpcoming(e.date) && e.status === 'published')
    .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastEvents = events
    .filter((e: Event) => !isUpcoming(e.date) || e.status === 'ended')
    .sort((a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime())

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
        {/* Organizer profile card */}
        <div style={{ marginTop: '24px', marginBottom: '24px' }}>
          <OrganizerCard
            variant="profile"
            organizer={{
              _id: slug,
              name: organizerName,
              image: undefined,
              isPartner: true,
              isVerify: {},
            }}
            stats={{
              followerCount,
              eventCount: stats?.eventCount ?? 0,
              totalTicketsSold: stats?.totalTicketsSold ?? 0,
            }}
            isFollowing={isFollowing}
            onFollow={handleFollow}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <WhatsAppButton
            href={`https://wa.me/?text=${encodeURIComponent(`Hi ${organizerName}, I found you on ComfyTag and I'm interested in your events.`)}`}
            label="Contact on WhatsApp"
          />
        </div>

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
