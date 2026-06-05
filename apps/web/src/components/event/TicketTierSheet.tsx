'use client'

import React, { useState, useEffect } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@comfytag/ui'
import { formatNaira, calculatePlatformFee, calculatePaystackFee } from '@comfytag/utils'
import type { TicketTier } from '@comfytag/types'

const MAX_TICKETS_PER_ORDER = 10

export interface TicketTierSheetProps {
  tiers: TicketTier[]
  isOpen: boolean
  onClose: () => void
  eventName?: string
  onCheckout: (tierId: string, qty: number) => void
}

function isSoldOut(tier: TicketTier): boolean {
  return tier.sold >= tier.capacity
}

function availableCount(tier: TicketTier): number {
  return Math.max(0, tier.capacity - tier.sold)
}

function fillRatio(tier: TicketTier): number {
  if (tier.capacity === 0) return 0
  return tier.sold / tier.capacity
}

export function TicketTierSheet({
  tiers,
  isOpen,
  onClose,
  eventName,
  onCheckout,
}: TicketTierSheetProps) {
  const firstAvailable = tiers.find((t) => !isSoldOut(t))
  const [selectedId, setSelectedId] = useState<string>(
    firstAvailable?._id ?? '',
  )
  const [qty, setQty] = useState(1)

  // Reset selection when sheet opens or tiers change
  useEffect(() => {
    if (isOpen) {
      const first = tiers.find((t) => !isSoldOut(t))
      setSelectedId(first?._id ?? '')
      setQty(1)
    }
  }, [isOpen, tiers])

  const selectedTier = tiers.find((t) => t._id === selectedId)
  const maxQty = selectedTier
    ? Math.min(availableCount(selectedTier), MAX_TICKETS_PER_ORDER)
    : 1

  // Ensure qty stays in range when tier changes
  useEffect(() => {
    setQty((prev) => Math.min(prev, Math.max(maxQty, 1)))
  }, [maxQty])

  const subtotal = selectedTier ? selectedTier.price * qty : 0
  const platformFee = calculatePlatformFee(subtotal, 4)
  const processingFee = calculatePaystackFee(subtotal)
  const total = subtotal + platformFee + processingFee

  function handleDecrement() {
    setQty((prev) => Math.max(1, prev - 1))
  }
  function handleIncrement() {
    setQty((prev) => Math.min(maxQty, prev + 1))
  }

  const displayEventName = eventName ?? 'Event'

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={displayEventName}>
      {/* Tier list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {tiers.map((tier) => {
          const soldOut = isSoldOut(tier)
          const selected = tier._id === selectedId
          const avail = availableCount(tier)
          const ratio = fillRatio(tier)
          const showBar = ratio > 0.5 && !soldOut

          return (
            <button
              key={tier._id}
              type="button"
              disabled={soldOut}
              onClick={() => {
                if (!soldOut) {
                  setSelectedId(tier._id)
                  setQty(1)
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                border: selected
                  ? '2px solid var(--color-brand)'
                  : '1.5px solid var(--color-border)',
                borderRadius: '12px',
                background: soldOut
                  ? 'var(--color-surface-2)'
                  : selected
                    ? 'var(--color-brand-alpha-4)'
                    : 'var(--color-surface)',
                cursor: soldOut ? 'not-allowed' : 'pointer',
                opacity: soldOut ? 0.7 : 1,
                transition: 'border-color 150ms ease, background 150ms ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: soldOut
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text)',
                      marginBottom: '2px',
                    }}
                  >
                    {tier.name}
                  </div>
                  {!soldOut && (
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {avail} left
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: soldOut
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text)',
                    }}
                  >
                    {tier.price === 0 ? 'Free' : formatNaira(tier.price)}
                  </span>
                  {soldOut && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-border)',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Sold Out
                    </span>
                  )}
                </div>
              </div>

              {/* Capacity bar */}
              {showBar && (
                <div
                  style={{
                    marginTop: '10px',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'var(--color-border)',
                    overflow: 'hidden',
                  }}
                  aria-hidden="true"
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(ratio * 100)}%`,
                      background: ratio > 0.85
                        ? 'var(--color-error)'
                        : 'var(--color-warning)',
                      borderRadius: '2px',
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Qty selector (only if a tier is selected) */}
      {selectedTier && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            Quantity
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={handleDecrement}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '18px',
                cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                opacity: qty <= 1 ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              −
            </button>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--color-text)',
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={qty >= maxQty}
              aria-label="Increase quantity"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '18px',
                cursor: qty >= maxQty ? 'not-allowed' : 'pointer',
                opacity: qty >= maxQty ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Fee breakdown */}
      {selectedTier && (
        <div
          style={{
            background: 'var(--color-surface-2)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <FeeRow label="Ticket subtotal" value={formatNaira(subtotal)} />
          <FeeRow label="Platform fee (4%)" value={formatNaira(platformFee)} muted />
          <FeeRow
            label="Processing fee (1.5% + ₦100)"
            value={formatNaira(processingFee)}
            muted
          />
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '8px',
              marginTop: '2px',
            }}
          >
            <FeeRow label="Total" value={formatNaira(total)} bold />
          </div>
        </div>
      )}

      {/* Trust badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--color-text-muted)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-success)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 12 15 15 9" />
        </svg>
        <span>Secured by Paystack</span>
      </div>

      <Button
        variant="primary"
        fullWidth
        disabled={!selectedTier}
        onClick={() => {
          if (selectedTier) onCheckout(selectedTier._id, qty)
        }}
      >
        Get Tickets
      </Button>
    </BottomSheet>
  )
}

function FeeRow({
  label,
  value,
  muted,
  bold,
}: {
  label: string
  value: string
  muted?: boolean
  bold?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: bold ? '15px' : '13px',
        fontWeight: bold ? 700 : 400,
        color: muted ? 'var(--color-text-muted)' : 'var(--color-text)',
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  )
}
