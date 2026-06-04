'use client'

import { formatNaira } from '@comfytag/utils'

interface WalletBalanceCardProps {
  balance: number
  available: number
  pending: number
}

export function WalletBalanceCard({ balance, available, pending }: WalletBalanceCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
      }}
    >
      {/* Total Balance */}
      <div>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            margin: '0 0 8px',
          }}
        >
          Total Balance
        </p>
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--color-brand)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {formatNaira(balance)}
        </h2>
      </div>

      {/* Available vs Pending */}
      <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
        <div>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              margin: '0 0 4px',
            }}
          >
            Available for Withdrawal
          </p>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-success)',
              margin: 0,
            }}
          >
            {formatNaira(available ?? 0)}
          </p>
        </div>
        <div>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              margin: '0 0 4px',
            }}
          >
            Pending Withdrawals
          </p>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-warning)',
              margin: 0,
            }}
          >
            {formatNaira(pending ?? 0)}
          </p>
        </div>
      </div>
    </div>
  )
}
