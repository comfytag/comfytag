'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Badge, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { WithdrawRequest } from '@comfytag/types'
import api from '@/lib/api'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'

// ─── Fetch function ────────────────────────────────────
const fetchWithdraws = async (token: string): Promise<WithdrawRequest[]> => {
  const { data } = await api.get<WithdrawRequest[]>('/admin/withdraw', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

// ─── Table columns ─────────────────────────────────────
const columns: ColumnDef<WithdrawRequest>[] = [
  {
    key: 'name',
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
  { key: 'event', header: 'Event', render: (w) => w.eventName },
  {
    key: 'amount',
    header: 'Amount',
    render: (w) => (
      <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>{formatNaira(w.amount)}</span>
    ),
  },
  { key: 'status', header: 'Status', render: (w) => <Badge status={w.status} /> },
  { key: 'date', header: 'Requested', render: (w) => formatDate(w.createdAt) },
]

// ─── Page ──────────────────────────────────────────────
export default function PayoutsPage() {
  const { data: session } = useSession()

  const { data: withdraws, isLoading, isError } = useQuery({
    queryKey: ['admin', 'withdraws'],
    queryFn: () => fetchWithdraws(session?.user?.token ?? ''),
    enabled: !!session?.user?.token,
  })

  return (
    <div>
      <PageHeader
        title="Payouts"
        subtitle={isLoading ? 'Loading...' : `${(withdraws ?? []).length} payout requests`}
      />
      {isLoading && <LoadingSpinner size="md" centered />}
      {isError && <ErrorMessage message="Failed to load payouts" />}
      {!isLoading && !isError && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <DataTable columns={columns} data={withdraws ?? []} />
        </div>
      )}
    </div>
  )
}
