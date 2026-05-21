'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button, Input, ErrorMessage } from '@comfytag/ui'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await signIn('credentials', { email, password, redirect: false })

    setIsLoading(false)

    if (result?.error) {
      setError('Invalid email or password')
    } else if (result?.ok) {
      router.push('/overview')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontWeight: 700, fontSize: '28px', color: 'var(--color-brand)', margin: 0 }}>
            ComfyTag
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>
            Partner Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" variant="primary" loading={isLoading} fullWidth>
            Sign in
          </Button>

          <div style={{ textAlign: 'right', marginTop: '12px' }}>
            <a
              href="/forgot-password"
              style={{ color: 'var(--color-text-muted)', fontSize: '13px', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-brand)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <div style={{ marginTop: '8px' }}>
              <ErrorMessage message={error} />
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
