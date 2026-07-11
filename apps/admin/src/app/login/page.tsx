'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ShieldCheck } from 'lucide-react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'

export default function AdminLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setError('')
    setIsPending(true)
    const result = await signIn('credentials', { email, password, otp: '', redirect: false })
    setIsPending(false)
    if (!result) { setError('Something went wrong. Try again.'); return }
    if (result.error === 'TWO_FACTOR_REQUIRED') { setStep('2fa'); return }
    if (result.error) { setError('Invalid email or password.'); return }
    router.push('/overview')
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter your 6-digit code.'); return }
    setError('')
    setIsPending(true)
    const result = await signIn('credentials', { email, password, otp, redirect: false })
    setIsPending(false)
    if (!result) { setError('Something went wrong. Try again.'); return }
    if (result.error) { setError('Invalid or expired code.'); return }
    router.push('/overview')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 36px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-brand)',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>
            {step === 'credentials' ? 'Admin Sign In' : 'Two-Factor Auth'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            {step === 'credentials'
              ? 'ComfyTag Admin Dashboard'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <ErrorMessage message={error} />}
            <div style={{ marginTop: '8px' }}>
              <Button type="submit" variant="primary" fullWidth loading={isPending}>
                Sign In
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  marginBottom: '6px',
                }}
              >
                Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 14px',
                  fontSize: '24px',
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {error && <ErrorMessage message={error} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <Button type="submit" variant="primary" fullWidth loading={isPending}>
                Verify
              </Button>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => { setStep('credentials'); setOtp(''); setError('') }}
              >
                ← Back
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
