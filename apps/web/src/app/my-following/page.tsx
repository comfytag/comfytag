'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { EventCard, OrganizerCard } from '@/components/ui'
import { EmptyState, Skeleton } from '@comfytag/ui'
import { useMyFollowing } from '@/hooks/useProfile'
import type { Event } from '@comfytag/types'

interface FollowedOrganizer {
  _id: string
  name: string
  image?: string
  isPartner: boolean
  isVerify: {
    email: boolean
    photo: boolean
  }
}

export default function MyFollowingPage() {
  const { data: session, status } = useSession()
  const { data: followedOrganizers = [], isLoading } = useMyFollowing()

  // TODO: Fetch events from followed organizers (separate hook or combined)
  const events: Event[] = []

  if (status === 'unauthenticated') return null

  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg-public)',
          padding: '32px 16px',
        }}
      >
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '8px',
            }}
          >
            Following
          </h1>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '15px',
              marginBottom: '32px',
            }}
          >
            Events from organizers you follow
          </p>

          {isLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="250px" borderRadius="12px" />
              ))}
            </div>
          ) : followedOrganizers.length === 0 ? (
            <EmptyState
              title="You're not following anyone yet"
              subtitle="Follow organizers to see their upcoming events here"
              action={{ label: 'Browse Events', href: '/events' }}
            />
          ) : events.length === 0 ? (
            <>
              {/* Still show followed organizers even when no events */}
              <section style={{ marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    marginBottom: '16px',
                  }}
                >
                  Followed Organizers ({followedOrganizers.length})
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {followedOrganizers.map((org: FollowedOrganizer) => (
                    <OrganizerCard
                      key={org._id}
                      organizer={org}
                      href={`/organizer/${org._id}`}
                      isFollowing
                    />
                  ))}
                </div>
              </section>

              <EmptyState
                title="No upcoming events"
                subtitle="Your followed organizers don't have events coming up right now"
                action={{ label: 'Browse Events', href: '/events' }}
              />
            </>
          ) : (
            <>
              {/* Followed Organizers strip */}
              <section style={{ marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    marginBottom: '16px',
                  }}
                >
                  Followed Organizers ({followedOrganizers.length})
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {followedOrganizers.map((org: FollowedOrganizer) => (
                    <OrganizerCard
                      key={org._id}
                      organizer={org}
                      href={`/organizer/${org._id}`}
                      isFollowing
                    />
                  ))}
                </div>
              </section>

              {/* Events from followed organizers */}
              <section>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    marginBottom: '16px',
                  }}
                >
                  Upcoming Events
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {events.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      href={`/events/${event._id}`}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  )
}
