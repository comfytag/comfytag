'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Banknote } from 'lucide-react'
import { Badge, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { WithdrawRequest } from '@comfytag/types'
import api from '@/lib/api'
import { StatCard } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'

// ─── Fetch functions ───────────────────────────────────
const fetchWithdraw = async (id: string, token: string): Promise<WithdrawRequest> => {
  const { data } = await api.get<WithdrawRequest>(`/admin/withdraw/show/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

const updateWithdrawStatus = async (id: string, status: string, token: string): Promise<void> => {
  await api.put(`/admin/withdraw/edit/${id}`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ─── InfoField helper ──────────────────────────────────
function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--color-text)' }}>{value}</div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────
export default function PayoutDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()

  const { data: withdraw, isLoading, isError } = useQuery({
    queryKey: ['admin', 'withdraw', id],
    queryFn: () => fetchWithdraw(id, session?.user?.token ?? ''),
    enabled: !!id && !!session?.user?.token,
  })

  const mutation = useMutation({
    mutationFn: (newStatus: 'approved' | 'rejected') =>
      updateWithdrawStatus(id, newStatus, session?.user?.token ?? ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'withdraw', id] }),
  })

  if (isLoading) return <LoadingSpinner size="lg" centered />
  if (isError || !withdraw) return <ErrorMessage message="Failed to load payout" />

  return (
    <div>
      <PageHeader
        title="Payout Request"
        action={
          <Link
            href="/payouts"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Payouts
          </Link>
        }
      />

      {/* Details card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <InfoField label="Account Name" value={withdraw.acctName} />
          <InfoField label="Account Number" value={withdraw.acctNumber} />
          <InfoField label="Bank" value={withdraw.bankName} />
          <InfoField label="Event" value={withdraw.eventName} />
          <InfoField label="Requested" value={formatDate(withdraw.createdAt)} />
          <InfoField label="Status" value={<Badge status={withdraw.status} />} />
        </div>
      </div>

      {/* Amount stat */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ '--color-text': 'var(--color-gold)' } as unknown as CSSProperties}>
          <StatCard icon={Banknote} value={formatNaira(withdraw.amount)} label="Payout Amount" />
        </div>
      </div>

      {/* Action buttons — only show when status is 'pending' */}
      {withdraw.status === 'pending' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => mutation.mutate('approved')}
            disabled={mutation.isPending}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              backgroundColor: 'var(--color-success)',
              color: '#fff',
              opacity: mutation.isPending ? 0.6 : 1,
            }}
          >
            {mutation.isPending ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => mutation.mutate('rejected')}
            disabled={mutation.isPending}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              backgroundColor: 'transparent',
              color: 'var(--color-error)',
              border: '1px solid var(--color-error)',
              opacity: mutation.isPending ? 0.6 : 1,
            }}
          >
            Reject
          </button>
        </div>
      )}

      {/* Mutation result feedback */}
      {mutation.isSuccess && (
        <div style={{ marginTop: 16, color: 'var(--color-success)', fontSize: 14 }}>
          Status updated successfully.
        </div>
      )}
      {mutation.isError && (
        <div style={{ marginTop: 16, color: 'var(--color-error)', fontSize: 14 }}>
          Failed to update status.
        </div>
      )}
    </div>
  )
}
