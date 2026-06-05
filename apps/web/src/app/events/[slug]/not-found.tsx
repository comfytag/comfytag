import Link from 'next/link'

export default function EventNotFound() {
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
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '64px',
          fontWeight: 700,
          color: 'var(--color-brand)',
          margin: '0 0 8px',
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: 'var(--color-text)',
          margin: '0 0 8px',
        }}
      >
        Event not found
      </h2>
      <p
        style={{
          fontSize: '15px',
          color: 'var(--color-text-muted)',
          margin: '0 0 24px',
        }}
      >
        This event doesn't exist or may have been removed.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/events"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 24px',
            background: 'var(--color-brand)',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          Browse Events
        </Link>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 24px',
            background: 'none',
            color: 'var(--color-brand)',
            border: '1.5px solid var(--color-brand)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
