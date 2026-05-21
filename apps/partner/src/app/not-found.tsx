export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
minHeight: '100vh', gap: '16px' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-brand)' }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Page not found</p>
      <a href="/" style={{ color: 'var(--color-brand)', textDecoration: 'underline' }}>Go home</a>
    </div>
  )
}
