'use client'

import type { TierStats } from '@comfytag/types'
import { TierProgressCard } from './TierProgressCard'

interface TierBreakdownSectionProps {
  tiers: TierStats[]
}

export function TierBreakdownSection({ tiers }: TierBreakdownSectionProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '32px',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Ticket Tiers Breakdown</h2>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {tiers.map((tier) => (
            <TierProgressCard key={tier._id} tier={tier} />
          ))}
        </div>
      </div>
    </div>
  )
}
