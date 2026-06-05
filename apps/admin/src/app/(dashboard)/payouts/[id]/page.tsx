'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Banknote } from 'lucide-react'
import { Badge, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { WithdrawRequest } from '@comfytag/types'
import { StatCard } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { usePayoutById, useApprovePayout, useRejectPayout } from '@/hooks'

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
  const params = useParams()
  const id = params.id as string

  const { data: withdraw, isLoading, isError } = usePayoutById(id)
  const approveMutation = useApprovePayout()
  const rejectMutation = useRejectPayout()

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
            onClick={() => approveMutation.mutate({ id })}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              backgroundColor: 'var(--color-success)',
              color: '#fff',
              opacity: approveMutation.isPending || rejectMutation.isPending ? 0.6 : 1,
            }}
          >
            {approveMutation.isPending ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => rejectMutation.mutate({ id })}
            disabled={rejectMutation.isPending || approveMutation.isPending}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              backgroundColor: 'transparent',
              color: 'var(--color-error)',
              border: '1px solid var(--color-error)',
              opacity: rejectMutation.isPending || approveMutation.isPending ? 0.6 : 1,
            }}
          >
            Reject
          </button>
        </div>
      )}

      {/* Mutation result feedback */}
      {(approveMutation.isSuccess || rejectMutation.isSuccess) && (
        <div style={{ marginTop: 16, color: 'var(--color-success)', fontSize: 14 }}>
          Status updated successfully.
        </div>
      )}
      {(approveMutation.isError || rejectMutation.isError) && (
        <div style={{ marginTop: 16, color: 'var(--color-error)', fontSize: 14 }}>
          Failed to update status.
        </div>
      )}
    </div>
  )
}
