'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Banknote, Building2, CreditCard, User } from 'lucide-react'
import { LoadingSpinner, ErrorMessage, Badge, StatCard, InfoField, PageHeader } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import { PayoutActionPanel } from '@/components/payouts/PayoutActionPanel'
import { useAdminPayoutDetail } from '@/hooks'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayoutDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const { data: withdraw, isLoading, isError, refetch } = useAdminPayoutDetail(id)

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError || !withdraw) {
    return (
      <ErrorMessage
        message="Failed to load payout request"
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      {/* ─── Header ────────────────────────────────────────── */}
      <PageHeader
        title="Payout Request"
        subtitle={withdraw.acctName}
        action={
          <Link
            href="/payouts"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Payouts
          </Link>
        }
      />

      {/* ─── Transfer instructions card ────────────────────── */}
      {/* Prominently laid out so the finance admin can execute the bank transfer accurately */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-brand)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 20,
          }}
        >
          Transfer Instructions — verify all details before sending
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 24,
          }}
        >
          {/* Account name */}
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Account Name
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--color-text)',
              }}
            >
              {withdraw.acctName}
            </div>
          </div>

          {/* Account number — full, highlighted */}
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Account Number
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--color-text)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.08em',
              }}
            >
              {withdraw.acctNumber}
            </div>
          </div>

          {/* Bank name */}
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Bank
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
              {withdraw.bankName}
            </div>
          </div>

          {/* Amount — gold, very prominent */}
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Amount to Send
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: 'var(--color-gold)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatNaira(withdraw.amount)}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stat cards ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard icon={Banknote} label="Withdrawal Amount" value={formatNaira(withdraw.amount)} />
        <StatCard icon={Building2} label="Bank"             value={withdraw.bankName} />
        <StatCard icon={CreditCard} label="Account"         value={`****${withdraw.acctNumber.slice(-4)}`} />
        <StatCard icon={User}       label="Account Name"    value={withdraw.acctName} />
      </div>

      {/* ─── Context metadata ──────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          marginBottom: 28,
        }}
      >
        <InfoField label="Event"     value={withdraw.eventName} />
        <InfoField label="Requested" value={formatDate(withdraw.createdAt)} />
        <InfoField label="Status"    value={<Badge status={withdraw.status} />} />
        {withdraw.updatedAt !== withdraw.createdAt && (
          <InfoField label="Last Updated" value={formatDate(withdraw.updatedAt)} />
        )}
      </div>

      {/* ─── Finance action panel ──────────────────────────── */}
      <PayoutActionPanel withdrawId={withdraw._id} withdraw={withdraw} />
    </div>
  )
}
