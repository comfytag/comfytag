'use client'

import { formatNaira, formatDate } from '@comfytag/utils'
import { ChartCard } from '@/components/ui/ChartCard'
import { EmptyState } from '@comfytag/ui'

interface Transaction {
  _id: string
  amount: number
  createdAt: string
  eventName?: string
  description?: string
}

interface EarningsTimelineProps {
  transactions: Transaction[]
}

export function EarningsTimeline({ transactions }: EarningsTimelineProps) {
  const sortedTransactions = [...(transactions ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const recentTransactions = sortedTransactions.slice(0, 6)

  if (recentTransactions.length === 0) {
    return (
      <ChartCard title="Recent Earnings" subtitle="Last 6 transactions">
        <div style={{ padding: '32px 20px' }}>
          <EmptyState title="No transactions yet" subtitle="Your earnings will appear here" />
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Recent Earnings" subtitle="Last 6 transactions">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px',
        }}
      >
        {recentTransactions.map((tx) => (
          <div
            key={tx._id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: '0 0 2px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                {tx.eventName ?? tx.description ?? 'Transaction'}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                }}
              >
                {formatDate(tx.createdAt)}
              </p>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-success)',
              }}
            >
              +{formatNaira(tx.amount)}
            </p>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
