'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LoadingSpinner, ErrorMessage, Badge, DataTable, PageHeader } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import type { WithdrawRequest } from '@comfytag/types'
import { formatNaira, formatDate } from '@comfytag/utils'
import { useAdminPayoutList, useAllPayouts } from '@/hooks'

// ─── Table columns ────────────────────────────────────────────────────────────

const columns: ColumnDef<WithdrawRequest>[] = [
  {
    key: 'organizer',
    header: 'Organizer',
    render: (w) => (
      <Link
        href={`/payouts/${w._id}`}
        style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 500 }}
      >
        {w.acctName}
      </Link>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    render: (w) => (
      <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>
        {formatNaira(w.amount)}
      </span>
    ),
  },
  {
    key: 'bank',
    header: 'Bank / Account',
    render: (w) => (
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{w.bankName}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          ****{w.acctNumber.slice(-4)}
        </div>
      </div>
    ),
  },
  {
    key: 'event',
    header: 'Event',
    render: (w) => (
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{w.eventName}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (w) => <Badge status={w.status} />,
  },
  {
    key: 'requested',
    header: 'Requested',
    render: (w) => (
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
        {formatDate(w.createdAt)}
      </span>
    ),
  },
  {
    key: 'action',
    header: '',
    render: (w) => (
      <Link
        href={`/payouts/${w._id}`}
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
        Process →
      </Link>
    ),
  },
]

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid',
        borderColor: active ? 'var(--color-brand)' : 'var(--color-border)',
        backgroundColor: active ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
        color: active ? 'var(--color-brand)' : 'var(--color-text-muted)',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'all'

export default function PayoutsPage() {
  const [tab, setTab] = useState<Tab>('pending')

  // Both queries run in parallel so tab switching is instant after first load
  const pendingQuery = useAdminPayoutList()
  const allQuery     = useAllPayouts()

  const isLoading = tab === 'pending' ? pendingQuery.isLoading : allQuery.isLoading
  const isError   = tab === 'pending' ? pendingQuery.isError   : allQuery.isError
  const refetch   = tab === 'pending' ? pendingQuery.refetch   : allQuery.refetch

  const payouts: WithdrawRequest[] =
    tab === 'pending'
      ? (pendingQuery.data?.data ?? [])
      : (allQuery.data ?? [])

  const total =
    tab === 'pending'
      ? (pendingQuery.data?.pagination?.total ?? payouts.length)
      : payouts.length

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError) {
    return (
      <ErrorMessage
        message="Failed to load payouts"
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <PageHeader
        title="Payouts"
        subtitle={`${total} ${tab === 'pending' ? 'pending' : ''} payout${total !== 1 ? 's' : ''}`}
      />

      {/* ─── Tab filter ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
          Pending
        </TabButton>
        <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
          All Requests
        </TabButton>
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
        <DataTable<WithdrawRequest>
          columns={columns}
          data={payouts}
          isLoading={isLoading}
          keyField="_id"
          emptyTitle={tab === 'pending' ? 'No pending payouts' : 'No payout requests'}
          emptySubtitle={
            tab === 'pending'
              ? 'All withdrawal requests have been processed.'
              : 'No organizers have submitted withdrawal requests yet.'
          }
        />
      </div>
    </div>
  )
}
