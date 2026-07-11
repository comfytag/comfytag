'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LoadingSpinner, ErrorMessage, Badge, DataTable, PageHeader } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { formatDate } from '@comfytag/utils'
import { useAdminEventList } from '@/hooks'

// ─── Status filter options ────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'published', label: 'Published'    },
  { value: 'draft',     label: 'Draft'        },
  { value: 'cancelled', label: 'Suspended'    },
  { value: 'ended',     label: 'Ended'        },
]

// ─── Table columns ────────────────────────────────────────────────────────────

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
  {
    key: 'organizer',
    header: 'Organizer',
    render: (e) =>
      e.planner_id ? (
        <Link
          href={`/users/${e.planner_id}`}
          style={{ color: 'var(--color-brand)', textDecoration: 'none', fontSize: 13 }}
        >
          {e.planner}
        </Link>
      ) : (
        <span style={{ fontSize: 13 }}>{e.planner}</span>
      ),
  },
  {
    key: 'date',
    header: 'Start Date',
    render: (e) => (
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
        {formatDate(e.date)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (e) => <Badge status={e.status} />,
  },
  {
    key: 'sold',
    header: 'Tickets Sold',
    render: (e) => (
      <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
        {e.sold}
        <span style={{ color: 'var(--color-text-muted)' }}>
          {' / '}
          {e.ticketType.reduce((sum, t) => sum + t.capacity, 0)}
        </span>
      </span>
    ),
  },
  {
    key: 'action',
    header: '',
    render: (e) => (
      <Link
        href={`/events/${e._id}`}
        style={{
          display: 'inline-block',
          padding: '5px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-brand)',
          border: '1px solid var(--color-brand)',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Manage →
      </Link>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, isError, refetch } = useAdminEventList(
    statusFilter ? { status: statusFilter } : {},
  )

  const events = data?.data ?? []
  const total  = data?.pagination?.total ?? 0

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError) {
    return (
      <ErrorMessage
        message="Failed to load events"
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <PageHeader
        title="Events"
        subtitle={`${total} event${total !== 1 ? 's' : ''}${statusFilter ? ` — ${STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}` : ''}`}
      />

      {/* ─── Status filter ─────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 14,
            cursor: 'pointer',
            outline: 'none',
            minWidth: 160,
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Table ─────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <DataTable<Event>
          columns={columns}
          data={events}
          isLoading={isLoading}
          keyField="_id"
          emptyTitle="No events found"
          emptySubtitle={
            statusFilter
              ? `No events with status "${STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}".`
              : 'No events have been created on the platform yet.'
          }
        />
      </div>
    </div>
  )
}
