'use client'

import Link from 'next/link'
import { Badge, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { useAllAdminEvents } from '@/hooks'

// ─── Table columns ─────────────────────────────────────
const columns: ColumnDef<Event>[] = [
  {
    key: 'name',
    header: 'Event',
    render: (e) => (
      <Link
        href={`/events/${e._id}`}
        style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 500 }}
      >
        {e.name}
      </Link>
    ),
  },
  { key: 'organizer', header: 'Organizer', render: (e) => e.planner },
  { key: 'date', header: 'Date', render: (e) => formatDate(e.date) },
  { key: 'status', header: 'Status', render: (e) => <Badge status={e.status} /> },
  {
    key: 'sold',
    header: 'Sold / Cap',
    render: (e) => `${e.sold} / ${e.ticketType.reduce((s, t) => s + t.capacity, 0)}`,
  },
  {
    key: 'revenue',
    header: 'Revenue',
    render: (e) => (
      <span style={{ color: 'var(--color-gold)' }}>
        {formatNaira(e.sold * (e.ticketType?.[0]?.price ?? 0))}
      </span>
    ),
  },
]

export default function EventsPage() {
  const { data: events, isLoading, isError } = useAllAdminEvents()

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle={isLoading ? 'Loading...' : `${(events ?? []).length} events`}
      />
      {isLoading && <LoadingSpinner size="md" centered />}
      {isError && <ErrorMessage message="Failed to load events" />}
      {!isLoading && !isError && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <DataTable columns={columns} data={events ?? []} />
        </div>
      )}
    </div>
  )
}
