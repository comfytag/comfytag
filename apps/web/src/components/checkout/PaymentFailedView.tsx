'use client'

import React from 'react'
import { Button, ErrorMessage } from '@comfytag/ui'

export type FailureReason = 'verification_failed' | 'payment_declined' | 'timeout'

interface PaymentFailedViewProps {
  reason: FailureReason
  onRetry: () => void
  onRetryDebited?: () => void
}

const FAILURE_CONFIG: Record<FailureReason, { message: string; buttonLabel: string }> = {
  verification_failed: {
    message: 'Payment received but ticket not issued. Tap below to retry verification.',
    buttonLabel: 'Retry Verification',
  },
  payment_declined: {
    message: 'Payment was declined. Check your card details and try again.',
    buttonLabel: 'Try Again',
  },
  timeout: {
    message: 'The payment timed out. If you were charged, tap below.',
    buttonLabel: 'Check my payment status',
  },
}

export function PaymentFailedView({
  reason,
  onRetry,
  onRetryDebited,
}: PaymentFailedViewProps) {
  const cfg = FAILURE_CONFIG[reason]

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Error icon */}
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="var(--color-error)" />
          <path
            d="M8 8l8 8M16 8l-8 8"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>

        <h2
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Payment Issue
        </h2>

        <ErrorMessage message={cfg.message} />

        <div style={{ width: '100%' }}>
          <Button variant="primary" fullWidth onClick={onRetry}>
            {cfg.buttonLabel}
          </Button>
        </div>

        {onRetryDebited && (
          <button
            type="button"
            onClick={onRetryDebited}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              textDecoration: 'underline',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            Debited but no ticket?
          </button>
        )}
      </div>
    </div>
  )
}
