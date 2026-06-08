'use client'

import React, { useState } from 'react'
import { Button, Input } from '@comfytag/ui'
import type { PromoCodeDiscount } from '@/hooks/useCheckout'

interface PromoCodeInputProps {
  onApply: (code: string) => Promise<PromoCodeDiscount | null>
  applied: PromoCodeDiscount | null
  disabled?: boolean
}

export function PromoCodeInput({ onApply, applied, disabled = false }: PromoCodeInputProps) {
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoError(null)
    setPromoLoading(true)
    try {
      const result = await onApply(promoCode)
      if (!result) {
        setPromoError('Invalid or expired code')
      }
    } catch {
      setPromoError('Invalid or expired code')
    } finally {
      setPromoLoading(false)
    }
  }

  if (!promoOpen) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setPromoOpen(true)}
          disabled={disabled}
          style={{
            background: 'none',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            color: disabled ? 'var(--color-text-muted)' : 'var(--color-brand)',
            padding: 0,
            fontFamily: 'inherit',
            textDecoration: 'underline',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          Have a promo code?
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: '0 0 10px',
          }}
        >
          Promo code
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <Input
              id="promo-code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code"
              disabled={applied !== null}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleApplyPromo}
            loading={promoLoading}
            disabled={applied !== null || promoLoading}
          >
            {applied ? 'Applied ✓' : 'Apply'}
          </Button>
        </div>
        {promoError && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-error)',
              margin: '6px 0 0',
            }}
          >
            {promoError}
          </p>
        )}
        {applied && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-success)',
              margin: '6px 0 0',
              fontWeight: 600,
            }}
          >
            Discount applied!
          </p>
        )}
      </div>
    </div>
  )
}
