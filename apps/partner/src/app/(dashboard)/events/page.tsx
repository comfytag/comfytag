'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Skeleton, EmptyState, ErrorMessage } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { EventCard } from '@/components/ui/EventCard'
import { EventFilterTabs } from '@/components/events/EventFilterTabs'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { useMyEvents, useDeleteEvent, useDuplicateEvent } from '@/hooks'
import { useQueryClient } from '@tanstack/react-query'

type FilterValue = 'all' | 'published' | 'draft' | 'ended' | 'cancelled'

export default function EventsPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [filter, setFilter] = useState<FilterValue>('all')
  const [view, setView] = useState<'table' | 'grid'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const { data: events = [], isLoading, isError } = useMyEvents()
  const duplicateMutation = useDuplicateEvent()
  const deleteEventMutation = useDeleteEvent()

  const tabFilters = useMemo(() => [
    { value: 'all', label: events.length > 0 ? `All (${events.length})` : 'All' },
    { value: 'published', label: `Published (${events.filter((e) => e.status === 'published').length})` },
    { value: 'draft', label: `Draft (${events.filter((e) => e.status === 'draft').length})` },
    { value: 'ended', label: `Ended (${events.filter((e) => e.status === 'ended').length})` },
    { value: 'cancelled', label: `Cancelled (${events.filter((e) => e.status === 'cancelled').length})` },
  ], [events])

  const filtered = useMemo(() => {
    let result = filter === 'all' ? events : events.filter(e => e.status === filter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e => e.name.toLowerCase().includes(q))
    }
    return result
  }, [events, filter, searchQuery])

  return (
    <div>
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

        {/* Search + Filter + View Toggle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '320px' }}>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 36px 9px 12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--color-text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: '16px',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                Ã—
              </button>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <EventFilterTabs
              active={filter}
              onChange={(v) => {
                setFilter(v as FilterValue)
                setSearchQuery('')
              }}
              tabs={tabFilters}
            />
            <ViewToggle view={view} onViewChange={setView} />
          </div>
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
                      <div key={event._id} style={{ position: 'relative' }}>
                        <EventCard
                          event={event}
                          status={
                            event.status === 'published' ? 'live'
                            : event.status === 'ended' ? 'ended'
                            : event.status === 'cancelled' ? 'cancelled'
                            : 'draft'
                          }
                          href={event.status === 'draft' ? `/events/${event._id}/edit` : `/events/${event._id}`}
                          onEdit={event.status !== 'ended' && event.status !== 'cancelled' ? () => {
                            window.location.href = `/events/${event._id}/edit`
                          } : undefined}
                          onDelete={() => {
                            if (confirm(`Delete "${event.name}"?`)) {
                              deleteEventMutation.mutate(event._id)
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            setDuplicatingId(event._id)
                            duplicateMutation.mutate(event._id, {
                              onSuccess: (newEvent) => {
                                router.push(`/events/${newEvent._id}/edit`)
                              },
                              onSettled: () => {
                                setDuplicatingId(null)
                              },
                            })
                          }}
                          disabled={!!duplicatingId}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            marginTop: '8px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            color: 'var(--color-text)',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: duplicatingId ? 'not-allowed' : 'pointer',
                            transition: 'background var(--duration-fast) ease',
                            opacity: duplicatingId ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!duplicatingId) {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)'
                          }}
                          title="Duplicate event"
                        >
                          {duplicatingId === event._id ? 'Duplicating...' : 'Duplicate'}
                        </button>
                      </div>
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
                                  : 'var(--color-text-on-brand)',
                          }}
                        >
                          {event.status === 'published' ? 'Live' : event.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)' }}>
                        {event.sold.toLocaleString('en-NG')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link
                            href={event.status === 'draft' ? `/events/${event._id}/edit` : `/events/${event._id}`}
                            style={{
                              color: 'var(--color-brand)',
                              fontSize: '13px',
                              textDecoration: 'none',
                              fontWeight: 500,
                            }}
                          >
                            {event.status === 'draft' ? 'Edit' : 'View'}
                          </Link>
                          <button
                            onClick={() => {
                              setDuplicatingId(event._id)
                              duplicateMutation.mutate(event._id, {
                                onSuccess: (newEvent) => {
                                  router.push(`/events/${newEvent._id}/edit`)
                                },
                                onSettled: () => {
                                  setDuplicatingId(null)
                                },
                              })
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-text-muted)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              textDecoration: 'none',
                              padding: '4px 8px',
                              transition: 'color var(--duration-fast) ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-brand)'
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'
                            }}
                            title="Duplicate event"
                            disabled={duplicatingId === event._id}
                          >
                            {duplicatingId === event._id ? 'Duplicating...' : 'Duplicate'}
                          </button>
                        </div>
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

