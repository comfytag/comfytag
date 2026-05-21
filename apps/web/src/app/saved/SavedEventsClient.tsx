'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { EventCard } from '@/components/ui'
import { EmptyState, LoadingSpinner, Skeleton } from '@comfytag/ui'
import api from '@/lib/api'
import { authHeader } from '@comfytag/utils'
import type { Event } from '@comfytag/types'

const PAGE_SIZE = 12

export default function SavedEventsClient() {
  const { data: session, status } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSaved = useCallback(
    async (pageNum: number) => {
      if (!session?.user?.token) return
      if (pageNum > 1) setIsLoadingMore(true)
      try {
        const response = await api.get<Event[]>(
          `/events/saved`,
          authHeader(session.user.token),
        )
        // API returns array directly; handle client-side pagination
        const allEvents = response.data
        const end = pageNum * PAGE_SIZE
        const slice = allEvents.slice(0, end)
        setEvents(slice)
        setHasMore(end < allEvents.length)
      } catch {
        setError('Failed to load saved events. Please try again.')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [session],
  )

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSaved(page)
    }
  }, [status, page, fetchSaved])

  if (status === 'loading' || (isLoading && events.length === 0)) {
    return (
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
              marginBottom: '32px',
            }}
          >
            Saved Events
          </h1>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} height="250px" borderRadius="12px" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg-public)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--color-error)' }}>{error}</p>
      </main>
    )
  }

  return (
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
            marginBottom: '32px',
          }}
        >
          Saved Events
        </h1>

        {events.length === 0 ? (
          <EmptyState
            title="No saved events yet"
            subtitle="Start exploring and save events you're interested in"
            action={{ label: 'Browse Events', href: '/events' }}
          />
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
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

            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoadingMore}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: isLoadingMore
                      ? 'var(--color-border)'
                      : 'var(--color-brand)',
                    color: '#ffffff',
                    fontWeight: 600,
                    border: 'none',
                    cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isLoadingMore ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
