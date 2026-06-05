'use client'

import Link from 'next/link'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import type { User } from '@comfytag/types'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { useAllUsers } from '@/hooks'

// ─── Columns ───────────────────────────────────────────
const columns: ColumnDef<User>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (u) => (
      <Link
        href={`/team/${u._id}`}
        style={{
          color: 'var(--color-brand)',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        {u.name}
      </Link>
    ),
  },
  { key: 'email', header: 'Email', render: (u) => u.email },
  { key: 'username', header: 'Username', render: (u) => `@${u.username}` },
  { key: 'joined', header: 'Joined', render: (u) => formatDate(u.createdAt) },
]

export default function TeamPage() {
  const usersQuery = useAllUsers()

  const admins = (usersQuery.data ?? []).filter((u) => u.isAdmin)

  if (usersQuery.isLoading) {
    return <LoadingSpinner size="lg" centered />
  }

  if (usersQuery.isError) {
    return (
      <ErrorMessage
        message="Failed to load team data"
        onRetry={() => void usersQuery.refetch()}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${admins.length} admins`}
        action={
          <Link
            href="/team/invite"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-brand)',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + Invite Admin
          </Link>
        }
      />

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <DataTable columns={columns} data={admins} isLoading={usersQuery.isLoading} />
      </div>
    </div>
  )
}
