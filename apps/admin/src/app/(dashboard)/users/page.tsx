'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { LoadingSpinner, ErrorMessage, Badge } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import type { User } from '@comfytag/types'
import api from '@/lib/api'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'

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

// ─── Fetch function ────────────────────────────────────
const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>('/admin/users')
  return data
}

// ─── Page ──────────────────────────────────────────────
export default function UsersPage() {
  const { data: session } = useSession({ required: true })

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
    enabled: !!session?.user,
  })

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
