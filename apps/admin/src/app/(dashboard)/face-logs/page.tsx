'use client'

import Link from 'next/link'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import type { User } from '@comfytag/types'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { useAllUsers } from '@/hooks'

// ─── Table columns ─────────────────────────────────────
const columns: ColumnDef<User>[] = [
  {
    key: 'name',
    header: 'User',
    render: (u) => (
      <Link
        href={`/face-logs/${u._id}`}
        style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 500 }}
      >
        {u.name}
      </Link>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    render: (u) => u.email,
  },
  {
    key: 'enrolled',
    header: 'Enrolled',
    render: (u) => (
      <span
        style={{
          fontSize: 12,
          padding: '2px 8px',
          borderRadius: 'var(--radius-lg)',
          fontWeight: 500,
          ...(u.faceEnrolled
            ? { background: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }
            : { background: 'rgba(168,162,158,0.1)', color: '#A8A29E' }),
        }}
      >
        {u.faceEnrolled ? 'Enrolled' : 'Not Enrolled'}
      </span>
    ),
  },
  {
    key: 'date',
    header: 'Enrolled On',
    render: (u) => (u.faceEnrolledAt ? formatDate(u.faceEnrolledAt) : '—'),
  },
  {
    key: 'type',
    header: 'Type',
    render: (u) => (
      <span
        style={{
          fontSize: 12,
          padding: '2px 8px',
          borderRadius: 'var(--radius-lg)',
          fontWeight: 500,
          ...(u.isPartner
            ? { background: 'rgba(124,58,237,0.15)', color: '#7C3AED' }
            : { background: 'rgba(168,162,158,0.1)', color: '#A8A29E' }),
        }}
      >
        {u.isPartner ? 'Organizer' : 'Attendee'}
      </span>
    ),
  },
]

// ─── Page ──────────────────────────────────────────────
export default function FaceLogsPage() {
  const { data: users, isLoading, isError, refetch } = useAllUsers()

  const enrolled = (users ?? []).filter((u) => u.faceEnrolled)

  if (isLoading) {
    return <LoadingSpinner size="lg" centered />
  }

  if (isError) {
    return (
      <ErrorMessage
        message="Failed to load face enrollments"
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Face Enrollments"
        subtitle={`${enrolled.length} enrolled users`}
      />

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
        }}
      >
        <DataTable columns={columns} data={enrolled} isLoading={isLoading} />
      </div>
    </div>
  )
}
