'use client'
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
minHeight: '100vh', gap: '16px' }}>
      <h2 style={{ color: 'var(--color-error)' }}>Something went wrong</h2>
      <button onClick={reset} style={{ color: 'var(--color-brand)', background: 'none', border: 'none', cursor:
'pointer', textDecoration: 'underline' }}>Try again</button>
    </div>
  )
}
