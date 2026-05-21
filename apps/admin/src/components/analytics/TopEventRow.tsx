'use client'

import { formatNaira, formatDate } from '@comfytag/utils'

interface TopEventRowProps {
  rank: number
  name: string
  date: string
  ticketsSold: number
  revenue: number
}

export function TopEventRow({ rank, name, date, ticketsSold, revenue }: TopEventRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Rank badge */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: 'color-mix(in srgb, var(--color-brand) 15%, transparent)',
          color: 'var(--color-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {rank}
      </div>

      {/* Event info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
          {formatDate(date)}
        </div>
      </div>

      {/* Tickets sold */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
          {ticketsSold.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>tickets</div>
      </div>

      {/* Revenue */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-financial)' }}>
          {formatNaira(revenue)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>revenue</div>
      </div>
    </div>
  )
}
