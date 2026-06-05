'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { EventCard } from '@/components/ui'
import { EmptyState, LoadingSpinner, Skeleton } from '@comfytag/ui'
import { useSavedEvents } from '@/hooks/useProfile'
import type { Event } from '@comfytag/types'

const PAGE_SIZE = 12

export default function SavedEventsClient() {
  const { data: session, status } = useSession()
  const { data: allEvents = [], isLoading, isError, error } = useSavedEvents()
  const [page, setPage] = useState(1)

  const events = allEvents.slice(0, page * PAGE_SIZE)
  const hasMore = page * PAGE_SIZE < allEvents.length
  const isLoadingMore = isLoading

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

  if (isError) {
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
        <p style={{ color: 'var(--color-error)' }}>Failed to load saved events. Please try again.</p>
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
