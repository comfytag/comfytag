'use client'

import { useEffect } from 'react'
import { ErrorMessage, Button } from '@comfytag/ui'

export default function EventDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        padding: '24px',
        gap: '16px',
      }}
    >
      <ErrorMessage message={error.message || 'Something went wrong'} />
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
      <a
        href="/events"
        style={{
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          fontSize: '14px',
          marginTop: '8px',
        }}
      >
        ← Back to events
      </a>
    </div>
  )
}
