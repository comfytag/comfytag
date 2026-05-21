'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Skeleton, EmptyState, Button, ErrorMessage } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import PartnerNav from '@/components/dashboard/PartnerNav'
import { EventCard } from '@/components/ui/EventCard'
import { EventFilterTabs } from '@/components/events/EventFilterTabs'
import { ViewToggle } from '@/components/ui/ViewToggle'
import api, { authHeader } from '@/lib/api'

type FilterValue = 'all' | 'published' | 'draft' | 'ended'

interface EventsResponse {
  success: boolean
  data: Event[]
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'ended', label: 'Ended' },
]

export default function EventsPage() {
  const { data: session } = useSession()
  const [filter, setFilter] = useState<FilterValue>('all')
  const [view, setView] = useState<'table' | 'grid'>('grid')

  const { data: events = [], isLoading, isError } = useQuery<Event[]>({
    queryKey: ['events', session?.user.id],
    queryFn: () =>
      api
        .get<EventsResponse>(`/events/user/${session!.user.id}`, {
          ...authHeader(session?.user.token),
        })
        .then((r) => r.data.data),
    enabled: !!session?.user.id,
  })

  const filtered = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.status === filter)),
    [events, filter],
  )

  return (
    <div>
      <PartnerNav />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '32px', paddingBottom: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0, marginBottom: '4px' }}>
                YOUR EVENTS
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
                Manage and track your events
              </p>
            </div>
            <Link
              href="/events/create"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-brand)',
                color: 'white',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background var(--duration-fast) ease',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-brand-dark)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-brand)'
              }}
            >
              <Plus size={16} />
              Create Event
            </Link>
          </div>
        </div>

        {/* Error */}
        {isError && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorMessage message="Failed to load events." />
          </div>
        )}

        {/* Filter + View Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <EventFilterTabs
            active={filter}
            onChange={(v) => setFilter(v as FilterValue)}
            tabs={FILTERS}
          />
          <ViewToggle view={view} onViewChange={setView} />
        </div>

        {/* Grid View */}
        {view === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    <Skeleton height={160} borderRadius={0} />
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Skeleton height={18} width="75%" />
                      <Skeleton height={14} width="45%" />
                      <Skeleton height={20} width={60} borderRadius={9999} />
                    </div>
                  </div>
                ))
              : filtered.length === 0
                ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <EmptyState
                        title="No events found"
                        subtitle={
                          filter === 'all'
                            ? 'Create your first event to get started'
                            : `No ${filter} events`
                        }
                        action={{ label: 'Create Event', href: '/events/create' }}
                      />
                    </div>
                  )
                : (
                    filtered.map((event) => (
                      <EventCard
                        key={event._id}
                        event={event}
                        status={event.status === 'published' ? 'live' : event.status === 'ended' ? 'ended' : 'draft'}
                        href={`/events/${event._id}`}
                        onEdit={() => {
                          window.location.href = `/events/${event._id}/edit`
                        }}
                        onDelete={() => {
                          if (confirm(`Delete "${event.name}"?`)) {
                            void api.delete(`/events/${event._id}`, authHeader(session?.user.token))
                          }
                        }}
                      />
                    ))
                  )}
          </div>
        ) : (
          /* Table View */
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {isLoading ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <Skeleton height={20} width="100%" />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px' }}>
                <EmptyState
                  title="No events found"
                  subtitle={
                    filter === 'all'
                      ? 'Create your first event to get started'
                      : `No ${filter} events`
                  }
                  action={{ label: 'Create Event', href: '/events/create' }}
                />
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Event</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tickets Sold</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr
                      key={event._id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-surface-2)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>{event.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)' }}>
                        {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            backgroundColor:
                              event.status === 'published'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : event.status === 'draft'
                                  ? 'rgba(168, 162, 158, 0.15)'
                                  : 'rgba(0, 0, 0, 0.15)',
                            color:
                              event.status === 'published'
                                ? 'var(--color-success)'
                                : event.status === 'draft'
                                  ? 'var(--color-text-muted)'
                                  : 'var(--color-text-muted)',
                          }}
                        >
                          {event.status === 'published' ? 'Live' : event.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)' }}>
                        {event.sold.toLocaleString('en-NG')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Link
                          href={`/events/${event._id}`}
                          style={{
                            color: 'var(--color-brand)',
                            fontSize: '13px',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
