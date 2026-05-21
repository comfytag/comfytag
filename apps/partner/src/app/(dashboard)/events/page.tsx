'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Badge, Skeleton, EmptyState, Button, ErrorMessage, DataTable, ColumnDef, PageHeader } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { EventCard } from '../../../components/ui/EventCard'
import { EventFilterTabs } from '../../../components/events/EventFilterTabs'
import { ViewToggle } from '../../../components/ui/ViewToggle'
import api, { authHeader } from '../../../lib/api'

type FilterValue = 'all' | 'published' | 'draft' | 'ended' | 'cancelled'

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'ended', label: 'Ended' },
  { value: 'cancelled', label: 'Cancelled' },
]

const EVENTS_PER_PAGE = 20

export default function EventsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterValue>('all')
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [page, setPage] = useState(1)

  const { data: allEvents = [], isLoading, isError } = useQuery<Event[]>({
    queryKey: ['events', session?.user.id, page],
    queryFn: () =>
      api
        .get<Event[]>('/events/user/' + session!.user.id, {
          params: { page, limit: EVENTS_PER_PAGE },
          ...authHeader(session?.user.token),
        })
        .then((r) => r.data),
    enabled: !!session?.user.id,
  })


  const columns: ColumnDef<Event>[] = [
    {
      key: 'name',
      header: 'Event',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{row.name}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => {
        const d = new Date(String(row.date ?? ''))
        return isNaN(d.getTime()) ? '—' : dateFmt.format(d)
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const s = String(row.status ?? '')
        const mapped = s === 'published' ? 'approved' : s === 'cancelled' ? 'rejected' : s
        return <Badge status={mapped} />
      },
    },
    {
      key: 'sold',
      header: 'Sold',
      render: (row) => ((row.sold as number) ?? 0).toLocaleString('en-NG'),
    },
    {
      key: '_id',
      header: '',
      width: '80px',
      render: (row) => (
        <Link
          href={'/events/' + row._id}
          style={{ color: 'var(--color-brand)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}
        >
          View
        </Link>
      ),
    },
  ]

  const events = allEvents

  const countByStatus = useMemo(
    () => ({
      all: events.length,
      published: events.filter((e) => e.status === 'published').length,
      draft: events.filter((e) => e.status === 'draft').length,
      ended: events.filter((e) => e.status === 'ended').length,
      cancelled: events.filter((e) => e.status === 'cancelled').length,
    }),
    [events],
  )

  const filtered = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.status === filter)),
    [events, filter],
  )

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader
        title="Events"
        subtitle="Manage and track your events"
        action={
          <Link
            href="/events/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-brand)',
              color: 'white',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-brand-light)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-brand)'
            }}
          >
            <Plus size={16} />
            Create Event
          </Link>
        }
      />

      {isError && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorMessage message="Failed to load events." />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <EventFilterTabs
          selected={filter}
          onSelect={(v) => setFilter(v as FilterValue)}
          options={FILTERS}
          counts={countByStatus}
        />

        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === 'table' ? (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            keyField="_id"
            emptyTitle="No events found"
            emptySubtitle={
              filter === 'all'
                ? 'Create your first event to get started'
                : 'No ' + filter + ' events'
            }
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <Skeleton height={160} borderRadius={0} />
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton height={18} width="75%" />
                  <Skeleton height={14} width="45%" />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '4px',
                    }}
                  >
                    <Skeleton height={20} width={60} borderRadius={9999} />
                    <Skeleton height={14} width={50} />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                title="No events found"
                subtitle={
                  filter === 'all'
                    ? 'Create your first event to get started'
                    : 'No ' + filter + ' events'
                }
                action={{ label: 'Create Event', href: '/events/create' }}
              />
            </div>
          ) : (
            filtered.map((event) => (
              <EventCard key={event._id} event={event} href={'/events/' + event._id} />
            ))
          )}
        </div>
      )}

      {!isLoading && events.length > 0 && events.length % EVENTS_PER_PAGE === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
          <Button variant="ghost" onClick={() => setPage(page + 1)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
