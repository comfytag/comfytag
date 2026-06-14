'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { SSOButton, GoogleIcon } from './SSOButton'
import type { AuthModalSuccessBanner } from '@/hooks/useAuthModal'

export interface LoginFormProps {
  onSwitchToRegister: () => void
  onSwitchToForgotPassword: () => void
  /** Called after successful sign-in. If omitted, falls back to router.push(callbackUrl). */
  onSuccess?: () => void
  initialEmail?: string
  successBanner?: AuthModalSuccessBanner
  callbackUrl?: string
}

export function LoginForm({
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onSuccess,
  initialEmail = '',
  successBanner,
  callbackUrl = '/',
}: LoginFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'credentials' | 'magic-link'>('credentials')
  const [email, setEmail] = useState(initialEmail)
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
    } else if (onSuccess) {
      // Modal context: close first so the modal vanishes cleanly, then
      // refresh server components to pick up the new session.
      onSuccess()
      router.refresh()
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
    <>
      {successBanner === 'registered' && (
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: 'var(--color-success)' }}>
          Welcome! Check your email to verify your account, then sign in.
        </div>
      )}
      {successBanner === 'password-reset' && (
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: 'var(--color-success)' }}>
          Password updated! Sign in with your new password.
        </div>
      )}

      <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
        {mode === 'credentials' ? 'Welcome back' : 'Sign in with email'}
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
        {mode === 'credentials' ? 'Good to see you again.' : "We'll send you a one-click link — no password needed."}
      </p>

      {!magicSent && (
        <>
          <SSOButton
            onClick={() => signIn('google', { callbackUrl })}
            icon={<GoogleIcon />}
            label="Continue with Google"
            style={{ marginBottom: '20px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              {mode === 'credentials' ? 'or sign in with email' : 'or use a magic link'}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>
        </>
      )}

      {magicSent ? (
        <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
          <div style={{ fontSize: '44px', marginBottom: '14px' }} aria-hidden="true">📬</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>
            Check your inbox
          </h3>
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
        <form onSubmit={handleCredentials}>
          <div style={{ marginBottom: '16px' }}>
            <Input id="lf-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <Input id="lf-password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-brand)', padding: 0 }}
            >
              Forgot password?
            </button>
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
        <form onSubmit={handleMagicLink}>
          <div style={{ marginBottom: '20px' }}>
            <Input id="lf-email-magic" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
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

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
        New to ComfyTag?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brand)', fontWeight: 600, fontSize: '14px', padding: 0 }}
        >
          Create account
        </button>
      </div>
    </>
  )
}
