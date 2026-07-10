'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { SSOButton, GoogleIcon } from './SSOButton'
import type { AuthModalSuccessBanner } from '@/hooks/useAuthModal'

export interface LoginFormProps {
  onSwitchToRegister: () => void
  onSwitchToForgotPassword: () => void
  onSwitchToVerifyEmail?: (email: string) => void
  /** Called after successful sign-in. If omitted, falls back to router.push(callbackUrl). */
  onSuccess?: () => void
  initialEmail?: string
  /** Force the initial mode — used when routing back here after a 2FA account hit the OTP flow. */
  initialMode?: 'otp' | 'credentials'
  successBanner?: AuthModalSuccessBanner
  callbackUrl?: string
}

export function LoginForm({
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onSwitchToVerifyEmail,
  onSuccess,
  initialEmail = '',
  initialMode = 'otp',
  successBanner,
  callbackUrl = '/',
}: LoginFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'otp' | 'credentials'>(initialMode)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpNote, setOtpNote] = useState('')
  const isVerificationError = !!error && error.toLowerCase().includes('not verified')

  useEffect(() => {
    if (!isVerificationError) return
    if (onSwitchToVerifyEmail) {
      onSwitchToVerifyEmail(email)
    } else {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    }
  }, [isVerificationError])  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const result = await signIn('credentials', { redirect: false, email, password })
    setIsLoading(false)
    if (result?.error) {
      // NextAuth returns the literal code 'CredentialsSignin' when authorize()
      // returns null (wrong password / user not found). Any other string is a
      // real message thrown by our backend (e.g. the 403 verification gate).
      setError(
        result.error === 'CredentialsSignin'
          ? "That email or password doesn't look right. Try again?"
          : result.error,
      )
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

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setOtpNote('')
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({})) as { message?: string; requiresPassword?: boolean }
      if (!res.ok) {
        setError(data.message ?? 'Something went wrong. Please try again.')
        return
      }
      if (data.requiresPassword) {
        setOtpNote('This account requires your password to sign in.')
        setMode('credentials')
        return
      }
      onSwitchToVerifyEmail?.(email)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  function switchMode(m: 'otp' | 'credentials') {
    setMode(m)
    setError('')
    setOtpNote('')
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
        Welcome back
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
        {mode === 'otp' ? "We'll email you a one-time code — no password needed." : 'Good to see you again.'}
      </p>

      <SSOButton
        onClick={() => signIn('google', { callbackUrl })}
        icon={<GoogleIcon />}
        label="Continue with Google"
        style={{ marginBottom: '20px' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {mode === 'otp' ? 'or sign in with a code' : 'or sign in with email'}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
      </div>

      {mode === 'otp' ? (
        <form onSubmit={handleRequestOtp}>
          <div style={{ marginBottom: '20px' }}>
            <Input id="lf-email-otp" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <Button type="submit" variant="primary" loading={isLoading} fullWidth>
            Send code
          </Button>
          {error && (
            <div style={{ marginTop: '10px' }}>
              <ErrorMessage message={error} />
            </div>
          )}
          <button
            type="button"
            onClick={() => switchMode('credentials')}
            style={{ width: '100%', marginTop: '14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-muted)', padding: '6px', textAlign: 'center' }}
          >
            Prefer a password? →
          </button>
        </form>
      ) : (
        <form onSubmit={handleCredentials}>
          {otpNote && (
            <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {otpNote}
            </div>
          )}
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
          {error && !isVerificationError && (
            <div style={{ marginTop: '10px' }}>
              <ErrorMessage message={error} />
            </div>
          )}
          <button
            type="button"
            onClick={() => switchMode('otp')}
            style={{ width: '100%', marginTop: '14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-muted)', padding: '6px', textAlign: 'center' }}
          >
            Prefer a code? →
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
