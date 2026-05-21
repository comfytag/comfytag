'use client'
import React from 'react'
import { Button } from '@comfytag/ui'

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--color-bg)', gap: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px' }} aria-hidden="true">😕</div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Something went wrong</h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0, maxWidth: '360px' }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button variant="primary" onClick={reset}>Try again</Button>
    </div>
  )
}
