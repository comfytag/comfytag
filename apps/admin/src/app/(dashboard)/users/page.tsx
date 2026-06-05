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
        href={`/users/${row._id}`}
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
    render: (row) =>
      row.isVerify?.email ? <Badge status="verified" /> : <Badge status="unverified" />,
  },
  {
    key: 'organizer',
    header: 'Type',
    render: (row) => (row.isPartner ? <Badge status="organizer" /> : <Badge status="user" />),
  },
  {
    key: 'face',
    header: 'Face',
    render: (row) =>
      row.faceEnrolled ? <Badge status="enrolled" /> : <Badge status="not enrolled" />,
  },
  { key: 'joined', header: 'Joined', render: (row) => formatDate(row.createdAt) },
]

// ─── Page ──────────────────────────────────────────────
export default function UsersPage() {
  const { data: users, isLoading, isError } = useAllUsers()

  return (
    <div style={{ padding: '32px 24px' }}>
      <PageHeader
        title="Users"
        subtitle={isLoading ? 'Loading...' : `${(users ?? []).length} registered users`}
      />

      {isError ? (
        <ErrorMessage message="Failed to load users" />
      ) : isLoading ? (
        <LoadingSpinner size="md" centered />
      ) : (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <DataTable columns={columns} data={users ?? []} isLoading={isLoading} />
        </div>
      )}
    </div>
  )
}
