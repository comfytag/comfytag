'use client'

import Link from 'next/link'
import { Badge, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
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
        href={`/promoted/${e._id}`}
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
    render: (e) => `${e.sold} / ${(e.ticketType ?? []).reduce((s, t) => s + t.capacity, 0)}`,
  },
]

export default function PromotedPage() {
  const { data: events, isLoading, isError } = useAllAdminEvents()

  const promoted = (events ?? []).filter((e) => e.featured)

  return (
    <div>
      <PageHeader
        title="Promoted Events"
        subtitle={`${promoted.length} featured events`}
        action={
          <Link
            href="/promoted/create"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-brand)',
              color: '#fff',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + Feature an Event
          </Link>
        }
      />

      {isLoading && <LoadingSpinner size="md" centered />}
      {isError && <ErrorMessage message="Failed to load promoted events" />}
      {!isLoading && !isError && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <DataTable columns={columns} data={promoted} />
        </div>
      )}
    </div>
  )
}
