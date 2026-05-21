import Link from 'next/link'
import { Button } from '@comfytag/ui'
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--color-bg)', gap: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '72px', fontWeight: 800, color: 'var(--color-brand)', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Page not found</h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>This page doesn&apos;t exist or was moved.</p>
      <Link href="/"><Button variant="primary">Go home</Button></Link>
    </div>
  )
}
