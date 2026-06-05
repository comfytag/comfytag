'use client'

import React from 'react'
import { StickyBottomBar } from '@/components/ui/StickyBottomBar'
import { formatNaira } from '@comfytag/utils'

interface EventStickyBarProps {
  isVisible: boolean
  minPrice: number
  allSoldOut: boolean
  onGetTickets: () => void
}

export function EventStickyBar({ isVisible, minPrice, allSoldOut, onGetTickets }: EventStickyBarProps) {
  return (
    <StickyBottomBar isVisible={isVisible} data-testid="event-sticky-bar">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          {allSoldOut ? (
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              Sold Out
            </span>
          ) : (
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
              From {minPrice === 0 ? 'Free' : formatNaira(minPrice)}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={allSoldOut}
          onClick={onGetTickets}
          style={{
            padding: '11px 28px',
            borderRadius: '10px',
            border: 'none',
            background: allSoldOut ? 'var(--color-border)' : 'var(--color-brand)',
            color: allSoldOut ? 'var(--color-text-muted)' : 'var(--color-text-on-brand)',
            fontSize: '15px',
            fontWeight: 700,
            cursor: allSoldOut ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          Get Tickets
        </button>
      </div>
    </StickyBottomBar>
  )
}
