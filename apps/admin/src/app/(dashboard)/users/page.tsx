'use client'

import Link from 'next/link'
import { LoadingSpinner, ErrorMessage, Badge, DataTable, PageHeader } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import type { UserAdminProfile } from '@comfytag/types'
import { formatDate } from '@comfytag/utils'
import { useAdminUserList } from '@/hooks'

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  super_admin:  { bg: 'rgba(124, 58, 237, 0.20)', color: '#C4B5FD', label: 'Super Admin'  },
  finance:      { bg: 'rgba(217, 119,   6, 0.15)', color: '#FCD34D', label: 'Finance'      },
  kyc_reviewer: { bg: 'rgba(124, 58, 237, 0.12)', color: '#A78BFA', label: 'KYC Reviewer' },
  support:      { bg: 'rgba( 14, 165, 233, 0.15)', color: '#7DD3FC', label: 'Support'      },
  moderator:    { bg: 'rgba( 16, 185, 129, 0.15)', color: '#6EE7B7', label: 'Moderator'    },
  viewer:       { bg: 'rgba(168, 162, 158, 0.15)', color: 'var(--color-text-muted)', label: 'User' },
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLE[role] ?? ROLE_STYLE.viewer
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: 12,
        fontWeight: 500,
        backgroundColor: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  )
}

// ─── Table columns ────────────────────────────────────────────────────────────

const columns: ColumnDef<UserAdminProfile>[] = [
  {
    key: 'name',
    header: 'User',
    render: (u) => (
      <Link
        href={`/users/${u._id}`}
        style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 500 }}
      >
        {u.name}
      </Link>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    render: (u) => (
      <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{u.email}</span>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    render: (u) => <RoleBadge role={u.role ?? 'viewer'} />,
  },
  {
    key: 'status',
    header: 'Status',
    render: (u) => <Badge status={u.suspended ? 'suspended' : 'active'} />,
  },
  {
    key: 'type',
    header: 'Type',
    render: (u) => (
      <span style={{ fontSize: 13 }}>{u.isPartner ? 'Organizer' : 'Attendee'}</span>
    ),
  },
  {
    key: 'joined',
    header: 'Joined',
    render: (u) => (
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
        {formatDate(u.createdAt)}
      </span>
    ),
  },
  {
    key: 'action',
    header: '',
    render: (u) => (
      <Link
        href={`/users/${u._id}`}
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

export default function UsersPage() {
  const { data, isLoading, isError, refetch } = useAdminUserList()

  const users = data?.data ?? []
  const total = data?.pagination?.total ?? 0

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError) {
    return (
      <ErrorMessage
        message="Failed to load user roster"
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <PageHeader
        title="Users"
        subtitle={`${total} user${total !== 1 ? 's' : ''} in the platform`}
      />

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <DataTable<UserAdminProfile>
          columns={columns}
          data={users}
          isLoading={isLoading}
          keyField="_id"
          emptyTitle="No users found"
          emptySubtitle="No user accounts have been created yet."
        />
      </div>
    </div>
  )
}
