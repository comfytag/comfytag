'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { SSOButton, GoogleIcon, AppleIcon } from '@/components/auth/SSOButton'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const didReset = searchParams.get('success') === '1'

  const [mode, setMode] = useState<'credentials' | 'magic-link'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const result = await signIn('credentials', { redirect: false, email, password })
    setIsLoading(false)
    if (result?.error) {
      setError("That email or password doesn't look right. Try again?")
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { message?: string }).message ?? 'Something went wrong. Please try again.')
      } else {
        setMagicSent(true)
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  function switchMode(m: 'credentials' | 'magic-link') {
    setMode(m)
    setError('')
    setMagicSent(false)
  }

  return (
    <AuthLayout>
      {/* Password-reset success banner */}
      {didReset && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '24px', fontSize: '13px', color: '#10B981' }}>
          Password updated! Sign in with your new password.
        </div>
      )}

      {/* Heading */}
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
        {mode === 'credentials' ? 'Welcome back' : 'Sign in with email'}
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
        {mode === 'credentials' ? 'Good to see you again.' : "We'll send you a one-click link — no password needed."}
      </p>

      {/* SSO buttons — hidden in magic-link success state */}
      {!magicSent && (
        <>
          {/* Google */}
          <SSOButton
            onClick={() => signIn('google', { callbackUrl })}
            icon={<GoogleIcon />}
            label="Continue with Google"
          />

          {/* Apple */}
          <SSOButton
            onClick={() => signIn('apple', { callbackUrl })}
            icon={<AppleIcon />}
            label="Continue with Apple"
            style={{ marginBottom: '24px' }}
          />

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              {mode === 'credentials' ? 'or sign in with email' : 'or use a magic link'}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>
        </>
      )}

      {/* Magic-link success */}
      {magicSent ? (
        <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
          <div style={{ fontSize: '44px', marginBottom: '14px' }} aria-hidden="true">📬</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>
            Check your inbox
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
            We sent a magic link to <strong style={{ color: 'var(--color-text)' }}>{email}</strong>. Click it to sign in instantly.
          </p>
          <button
            type="button"
            onClick={() => { setMagicSent(false); setError('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-brand)', textDecoration: 'underline', padding: 0 }}
          >
            Use a different email
          </button>
        </div>
      ) : mode === 'credentials' ? (
        /* Credentials form */
        <form onSubmit={handleCredentials}>
          <div style={{ marginBottom: '16px' }}>
            <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link href="/forgot-password" style={{ fontSize: '13px', color: 'var(--color-brand)', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
          <Button type="submit" variant="primary" loading={isLoading} fullWidth>
            Sign in
          </Button>
          {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
          <button
            type="button"
            onClick={() => switchMode('magic-link')}
            style={{ width: '100%', marginTop: '14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-muted)', padding: '6px', textAlign: 'center' }}
          >
            Prefer a magic link? →
          </button>
        </form>
      ) : (
        /* Magic-link form */
        <form onSubmit={handleMagicLink}>
          <div style={{ marginBottom: '20px' }}>
            <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <Button type="submit" variant="primary" loading={isLoading} fullWidth>
            Send magic link
          </Button>
          {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
          <button
            type="button"
            onClick={() => switchMode('credentials')}
            style={{ width: '100%', marginTop: '14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-muted)', padding: '6px', textAlign: 'center' }}
          >
            ← Use password instead
          </button>
        </form>
      )}

      {/* Register link */}
      <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '22px' }}>
        New to ComfyTag?{' '}
        <Link href="/register" style={{ color: 'var(--color-brand)', fontWeight: 600, textDecoration: 'none' }}>
          Create account
        </Link>
      </div>
    </AuthLayout>
  )
}
