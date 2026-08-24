'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { OtpInput } from '@/components/ui/OtpInput'
import { GoogleButton, OrDivider } from './GoogleButton'
import { api } from '@/lib/api'

type Step = 'email' | 'otp' | 'password' | '2fa'

// Shown when credentials/OTP are valid but the account isn't an organizer yet
// (a plain attendee account) — points at the actual fix instead of looping
// back to /register, which just 409s since the account already exists.
// "Sign in with Google" on this same page already auto-upgrades an existing
// attendee (see auth.ts's signIn callback), so that's the fastest path if
// the account has a Google login; otherwise the web app's profile page works too.
const NOT_PARTNER_MESSAGE =
  'This account exists as an attendee. Use "Sign in with Google" above to get organizer access instantly, or log in at the ComfyTag app and choose "Become a Partner" from your profile.'

export function LoginForm() {
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
        // The token provider returns null (not a thrown error) for a valid but
        // non-partner account, so NextAuth's generic 'CredentialsSignin' is
        // the only signal here — this really is the same "valid attendee
        // account, not yet an organizer" case as the password path above.
        setError(NOT_PARTNER_MESSAGE)
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
      } else if (result.error === 'NOT_PARTNER') {
        setError(NOT_PARTNER_MESSAGE)
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
      if (result.error === 'NOT_PARTNER') {
        setError(NOT_PARTNER_MESSAGE)
      } else {
        setError(result.error === 'CredentialsSignin' ? 'Invalid code. Please try again.' : result.error)
      }
    } else if (result?.ok) {
      router.push('/overview')
    }
  }

  return (
    <>
      {didRegister && (
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '24px', fontSize: '13px', color: 'var(--color-success)' }}>
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

          <OrDivider />

          <GoogleButton onClick={() => signIn('google', { callbackUrl: '/overview' })} />

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

          <OrDivider />

          <GoogleButton onClick={() => signIn('google', { callbackUrl: '/overview' })} />

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
        New to ComfyTag?{' '}
        <a href="/register" style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 600 }}>
          Start selling tickets
        </a>
      </p>
    </>
  )
}
