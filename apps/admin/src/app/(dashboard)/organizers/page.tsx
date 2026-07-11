'use client'

import Link from 'next/link'
import { LoadingSpinner, ErrorMessage, Badge } from '@comfytag/ui'
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
    header: 'Name',
    render: (row) => (
      <Link
        href={`/organizers/${row._id}`}
        style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 500 }}
      >
        {row.name}
      </Link>
    ),
  },
  { key: 'email', header: 'Email', render: (row) => row.email },
  {
    key: 'verified',
    header: 'Email Verified',
    render: (row) => row.isVerify?.email ? <Badge status="verified" /> : <Badge status="unverified" />,
  },
  {
    key: 'face',
    header: 'Face',
    render: (row) => row.faceEnrolled ? <Badge status="enrolled" /> : <Badge status="not enrolled" />,
  },
  { key: 'joined', header: 'Joined', render: (row) => formatDate(row.createdAt) },
]

// ─── Page ──────────────────────────────────────────────
export default function OrganizersPage() {
  const { data: users, isLoading, isError, refetch } = useAllUsers()

  const organizers = (users ?? []).filter((u) => u.isPartner)

  if (isLoading) {
    return <LoadingSpinner size="md" centered />
  }

  if (isError) {
    return (
      <ErrorMessage
        message="Failed to load organizers"
        onRetry={() => { void refetch() }}
      />
    )
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <PageHeader
        title="Organizers"
        subtitle={isLoading ? 'Loading...' : `${organizers.length} registered organizers`}
      />

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <DataTable<User> columns={columns} data={organizers} />
      </div>
    </div>
  )
}
