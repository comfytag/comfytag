'use client'

import type { TierStats } from '@comfytag/types'
import { formatNaira } from '@comfytag/utils'

interface TierProgressCardProps {
  tier: TierStats
}

export function TierProgressCard({ tier }: TierProgressCardProps) {
  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: 'var(--color-bg)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <p
          style={{
            margin: '0 0 4px 0',
            fontSize: '12px',
            color: 'var(--color-text)',
            fontWeight: 700,
          }}
        >
          {tier.name}
        </p>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
          {formatNaira(tier.price)}
        </p>
      </div>
      <div
        style={{
          height: '6px',
          backgroundColor: 'var(--color-border)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: 'var(--color-brand)',
            width: `${tier.soldPercentage}%`,
          }}
        />
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Sold: {tier.sold}/{tier.capacity}</span>
        <span>{Math.round(tier.soldPercentage)}%</span>
      </div>
    </div>
  )
}