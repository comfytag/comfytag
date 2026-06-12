'use client'

import Link from 'next/link'
import { LoadingSpinner, ErrorMessage, Badge, DataTable, PageHeader } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import type { UserAdminProfile } from '@comfytag/types'
import { formatDate } from '@comfytag/utils'
import { useKycQueue } from '@/hooks'

// ─── Table column definitions ─────────────────────────────────────────────────

const columns: ColumnDef<UserAdminProfile>[] = [
  {
    key: 'name',
    header: 'Organizer',
    render: (u) => (
      <Link
        href={`/kyc/${u._id}`}
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
    key: 'business',
    header: 'Business',
    render: (u) => (
      <span style={{ fontSize: 13 }}>{u.businessName ?? '—'}</span>
    ),
  },
  {
    key: 'docs',
    header: 'Documents',
    render: (u) => (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge status={u.isVerify?.photo   ? 'photo'   : 'no photo'}   />
        <Badge status={u.isVerify?.idCard  ? 'id card' : 'no id'}      />
        <Badge status={u.isVerify?.address ? 'address' : 'no address'} />
      </div>
    ),
  },
  {
    key: 'status',
    header: 'KYC Status',
    render: (u) => <Badge status={u.kycStatus ?? 'pending'} />,
  },
  {
    key: 'submitted',
    header: 'Submitted',
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
        href={`/kyc/${u._id}`}
        style={{
          display: 'inline-block',
          padding: '5px 14px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-brand)',
          border: '1px solid var(--color-brand)',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Review →
      </Link>
    ),
  },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function KycPage() {
  const { data: queueData, isLoading, isError, refetch } = useKycQueue()

  const users = queueData?.data ?? []
  const total = queueData?.pagination?.total ?? 0

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError) {
    return (
      <ErrorMessage
        message="Failed to load KYC queue"
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <PageHeader
        title="KYC Review"
        subtitle={
          isLoading
            ? 'Loading…'
            : `${total} organiser${total !== 1 ? 's' : ''} pending review`
        }
      />

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <DataTable<UserAdminProfile>
          columns={columns}
          data={users}
          isLoading={isLoading}
          keyField="_id"
          emptyTitle="No pending KYC applications"
          emptySubtitle="All organiser accounts are fully verified or no documents have been submitted yet."
        />
      </div>
    </div>
  )
}
