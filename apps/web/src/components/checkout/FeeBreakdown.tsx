'use client'

import React from 'react'
import { formatNaira } from '@comfytag/utils'

interface FeeBreakdownProps {
  subtotal: number
  processingFee: number
  total: number
}

export function FeeBreakdown({
  subtotal,
  processingFee,
  total,
}: FeeBreakdownProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Subtotal
        </span>
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {formatNaira(subtotal)}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Processing fee
        </span>
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {formatNaira(processingFee)}
        </span>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '8px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
          Total
        </span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
          {formatNaira(total)}
        </span>
      </div>
    </div>
  )
}
