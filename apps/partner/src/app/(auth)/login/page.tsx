'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { OtpInput } from '@/components/ui/OtpInput'
import { api } from '@/lib/api'

type Step = 'email' | 'otp' | 'password' | '2fa'

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const didRegister = searchParams.get('registered') === 'true'
  const registeredEmail = searchParams.get('email') ?? ''

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState(registeredEmail)
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [twoFactorOtp, setTwoFactorOtp] = useState<string[]>(Array(6).fill(''))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  useEffect(() => {
    const queryError = searchParams.get('error')
    if (queryError) {
      if (queryError === 'GoogleAccountNotFound' || queryError.includes('No account found')) {
        setError('No partner account found for this Google email. Please register first.')
      } else if (queryError.includes('partner access')) {
        setError('This Google account does not have partner access.')
      } else if (queryError === 'GoogleSignInFailed') {
        setError('Google sign-in failed. Please try again or use email/password.')
      } else {
        setError(queryError)
      }
    }
  }, [searchParams])

  function startCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setResendCooldown(60)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ── Step: email — request a passwordless code ─────────────────────────────
  async function requestCode(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const { data } = await api.post<{ requiresPassword?: boolean }>('/partner/auth/request-otp', { email })
      if (data.requiresPassword) {
        setStep('password')
      } else {
        setOtp(Array(6).fill(''))
        setStep('otp')
        startCooldown()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendCode() {
    setIsLoading(true)
    setError('')
    try {
      await api.post('/partner/auth/request-otp', { email })
      setOtp(Array(6).fill(''))
      startCooldown()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step: otp — verify the code, get a session ─────────────────────────────
  async function verifyCode(code: string) {
    if (code.length < 6 || isLoading) return
    setIsLoading(true)
    setError('')
    try {
      const { data } = await api.post<{ token?: string; requiresPassword?: boolean; message?: string }>(
        '/partner/auth/verify-email-otp',
        { email, otp: code }
      )
      if (data.requiresPassword) {
        setStep('password')
        return
      }
      if (!data.token) {
        setError('Something went wrong. Please try again.')
        return
      }
      const result = await signIn('token', { backendToken: data.token, redirect: false })
      if (result?.error) {
        setError('This account does not have partner access.')
        return
      }
      router.push('/overview')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Invalid or expired code.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step: password — existing flow, now 2FA-aware ───────────────────────────
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await signIn('credentials', { email, password, redirect: false })

    setIsLoading(false)

    if (result?.error) {
      if (result.error === 'TWO_FACTOR_REQUIRED') {
        setTwoFactorOtp(Array(6).fill(''))
        setStep('2fa')
      } else if (result.error === 'CredentialsSignin') {
        setError('Invalid email or password')
      } else {
        setError(result.error)
      }
    } else if (result?.ok) {
      router.push('/overview')
    }
  }

  async function handleTwoFactorSubmit(code: string) {
    if (code.length < 6 || isLoading) return
    setIsLoading(true)
    setError('')

    const result = await signIn('credentials', { email, password, otp: code, redirect: false })

    setIsLoading(false)

    if (result?.error) {
      setError(result.error === 'CredentialsSignin' ? 'Invalid code. Please try again.' : result.error)
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
          <h1 style={{ fontFamily: 'var(--font-anybody)', fontWeight: 800, fontSize: '30px', color: 'var(--color-brand)', margin: 0, letterSpacing: '-0.02em' }}>
            ComfyTag
          </h1>
          <p style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>
            Partner Dashboard
          </p>
        </div>

        {didRegister && (
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '24px', fontSize: '13px', color: 'var(--color-success)' }}>
            Welcome! Check your email to verify your account, then sign in.
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={requestCode}>
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

            <Button type="submit" variant="primary" loading={isLoading} fullWidth>
              Send sign-in code
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 12px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            </div>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/overview' })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface)'
                e.currentTarget.style.borderColor = 'var(--color-brand)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
              </svg>
              Continue with Google
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => { setError(''); setStep('password') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-muted)', textDecoration: 'underline', padding: 0 }}
              >
                Prefer a password? →
              </button>
            </div>

            {error && (
              <div style={{ marginTop: '12px' }}>
                <ErrorMessage message={error} />
              </div>
            )}
          </form>
        )}

        {step === 'otp' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontWeight: 700, fontSize: '20px', color: 'var(--color-text)', margin: 0 }}>
                Enter your code
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px', marginBottom: 0 }}>
                Sent to {email}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <OtpInput length={6} value={otp} onChange={setOtp} onComplete={verifyCode} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '13px' }}>
              {resendCooldown > 0 ? (
                <span style={{ color: 'var(--color-text-muted)' }}>Resend in {resendCooldown}s</span>
              ) : (
                <Button type="button" variant="ghost" size="sm" loading={isLoading} onClick={handleResendCode}>
                  Resend code
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              loading={isLoading}
              disabled={otp.some((d) => !d)}
              fullWidth
              onClick={() => verifyCode(otp.join(''))}
            >
              Sign in
            </Button>

            {error && (
              <div style={{ marginTop: '12px' }}>
                <ErrorMessage message={error} />
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => { setError(''); setStep('password') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-muted)', textDecoration: 'underline', padding: 0 }}
              >
                ← Use password instead
              </button>
            </div>
          </div>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
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

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 12px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            </div>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/overview' })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface)'
                e.currentTarget.style.borderColor = 'var(--color-brand)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => { setError(''); setStep('email') }}
                style={{ color: 'var(--color-text-muted)', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ← Use a code instead
              </button>
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
        )}

        {step === '2fa' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontWeight: 700, fontSize: '20px', color: 'var(--color-text)', margin: 0 }}>
                Two-factor authentication
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px', marginBottom: 0 }}>
                Enter the code from your authenticator app
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <OtpInput length={6} value={twoFactorOtp} onChange={setTwoFactorOtp} onComplete={handleTwoFactorSubmit} />
            </div>

            <Button
              type="button"
              variant="primary"
              loading={isLoading}
              disabled={twoFactorOtp.some((d) => !d)}
              fullWidth
              onClick={() => handleTwoFactorSubmit(twoFactorOtp.join(''))}
            >
              Verify
            </Button>

            {error && (
              <div style={{ marginTop: '12px' }}>
                <ErrorMessage message={error} />
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => { setError(''); setStep('password') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-muted)', textDecoration: 'underline', padding: 0 }}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Don't have an account?{' '}
          <a href="/register" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>
            Create one
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
