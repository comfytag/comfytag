'use client'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px',
      padding: '40px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239,68,68,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
      }}>⚠</div>
      <h2 style={{ color: 'var(--color-text)', fontSize: '20px', fontWeight: 600, margin: 0 }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', maxWidth: '360px', margin: 0 }}>
        {error.message ?? 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        style={{
          backgroundColor: 'var(--color-brand)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
