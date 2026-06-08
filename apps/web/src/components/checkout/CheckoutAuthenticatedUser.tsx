'use client'

import React from 'react'
import type { Session } from 'next-auth'

interface CheckoutAuthenticatedUserProps {
  session: Session
}

export function CheckoutAuthenticatedUser({ session }: CheckoutAuthenticatedUserProps) {
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
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-muted)',
          margin: '0 0 4px',
          fontWeight: 500,
        }}
      >
        Booking as
      </p>
      <p
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: '0 0 2px',
        }}
      >
        {session.user.name}
      </p>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
        {session.user.email}
      </p>
    </div>
  )
}
