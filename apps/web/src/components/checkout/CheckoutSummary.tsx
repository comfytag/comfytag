'use client'

import React from 'react'
import Image from 'next/image'
import { formatDate, formatNaira } from '@comfytag/utils'
import type { Event, TicketTier } from '@comfytag/types'

interface CheckoutSummaryProps {
  event: Event
  tier: TicketTier
  quantity: number
  isFree: boolean
  total: number
}

export function CheckoutSummary({
  event,
  tier,
  quantity,
  isFree,
  total,
}: CheckoutSummaryProps) {
  const coverSrc = event.coverImage ?? event.images[0]

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {coverSrc && (
          <Image
            src={coverSrc}
            alt={event.name}
            width={60}
            height={60}
            style={{ borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: '0 0 4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.name}
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              margin: '0 0 2px',
            }}
          >
            {formatDate(event.date)}
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.venue}
          </p>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
          {tier.name} × {quantity}
        </span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: isFree ? 'var(--color-success)' : 'var(--color-text)',
          }}
        >
          {isFree ? 'Free' : formatNaira(total)}
        </span>
      </div>
    </div>
  )
}
