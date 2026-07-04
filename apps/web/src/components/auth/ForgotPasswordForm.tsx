'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

function maskIdentifier(value: string): string {
  if (value.includes('@')) {
    const [local, domain] = value.split('@')
    return `${local.slice(0, 2)}***@${domain}`
  }
  return `${value.slice(0, 3)}***${value.slice(-4)}`
}

export interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void
  /** Called after a successful password reset. Falls back to onSwitchToLogin if omitted. */
  onPasswordReset?: () => void
}

export function ForgotPasswordForm({ onSwitchToLogin, onPasswordReset }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [otpFocused, setOtpFocused] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resetToken, setResetToken] = useState('')
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

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

  async function sendOtp(): Promise<boolean> {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { message?: string }).message ?? 'Failed to send OTP. Please try again.')
        return false
      }
      return true
    } catch {
      setError('Network error. Please check your connection.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    const ok = await sendOtp()
    if (ok) { setStep(2); startCooldown() }
  }

  // Takes the code explicitly rather than reading the `otp` state, since the
  // auto-submit-on-complete callers (handleOtpChange/handleOtpPaste) invoke
  // this in the same tick as setOtp() — before the state update has flushed —
  // so reading `otp` there would send the previous, incomplete code and the
  // backend would correctly report a false "Invalid OTP".
  async function verifyOtp(code: string) {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp: code }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { message?: string }).message ?? 'Invalid code. Please try again.')
      } else {
        const data = await res.json().catch(() => ({}))
        // BUG-12: Validate token presence — an empty string would silently allow a
        // reset attempt that the backend would reject with a confusing error
        const token = (data as { resetToken?: string }).resetToken
        if (!token) {
          setError('Verification failed. Please request a new code and try again.')
          return
        }
        setResetToken(token)
        setStep(3)
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault()
    await verifyOtp(otp)
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, newPassword, resetToken }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { message?: string }).message ?? 'Failed to reset password.')
      } else {
        if (onPasswordReset) {
          onPasswordReset()
        } else {
          onSwitchToLogin()
        }
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
    setOtp(digits)
    setError('')
    if (digits.length === 6) {
      void verifyOtp(digits)
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    setOtp(digits)
    setError('')
    if (digits.length === 6) {
      void verifyOtp(digits)
    }
  }

  const stepTitles = ['Reset your password', 'Enter verification code', 'Set new password']
  const stepSubtitles = [
    'Enter your email or phone to receive a one-time code.',
    `Sent to ${maskIdentifier(identifier)}`,
    'Choose a strong password — min. 8 characters.',
  ]

  return (
    <>
      {/* Back arrow for steps 2 & 3 */}
      {step > 1 && (
        <button
          type="button"
          onClick={() => { setError(''); setStep((step - 1) as 1 | 2 | 3) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0, marginBottom: '20px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
      )}

      {/* Step indicator dots */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              height: '4px',
              borderRadius: '2px',
              flex: s === step ? 2 : 1,
              background: s <= step ? 'var(--color-brand)' : 'var(--color-border)',
              transition: 'flex 300ms ease, background 300ms ease',
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
        {stepTitles[step - 1]}
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
        {stepSubtitles[step - 1]}
      </p>

      {step === 1 && (
        <form onSubmit={handleStep1}>
          <div style={{ marginBottom: '24px' }}>
            <Input id="fpf-identifier" label="Email or phone number" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 08012345678" required />
          </div>
          <Button type="submit" variant="primary" loading={isLoading} fullWidth>
            Send code
          </Button>
          {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            onPaste={handleOtpPaste}
            onFocus={() => setOtpFocused(true)}
            onBlur={() => setOtpFocused(false)}
            placeholder="000000"
            aria-label="6-digit verification code"
            autoFocus
            style={{
              width: '100%',
              height: '56px',
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '0.35em',
              textAlign: 'center',
              background: 'var(--color-surface-2)',
              border: `1.5px solid ${otpFocused ? 'var(--color-brand)' : 'var(--color-border)'}`,
              borderRadius: '12px',
              color: 'var(--color-text)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              boxShadow: otpFocused ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
              marginBottom: '16px',
            }}
          />
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {resendCooldown > 0 ? (
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => { const ok = await sendOtp(); if (ok) { setOtp(''); startCooldown() } }}
                disabled={isLoading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-brand)', padding: 0 }}
              >
                Resend code
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" loading={isLoading} disabled={otp.length < 6} fullWidth>
            Verify code
          </Button>
          {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleStep3}>
          <div style={{ marginBottom: '16px' }}>
            <Input id="fpf-newPassword" label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" required />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <Input id="fpf-confirmPassword" label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
          </div>
          <Button type="submit" variant="primary" loading={isLoading} fullWidth>
            Reset password
          </Button>
          {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
        </form>
      )}

      {/* "Back to sign in" only on step 1 */}
      {step === 1 && (
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
          Remembered it?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brand)', fontWeight: 600, fontSize: '14px', padding: 0 }}
          >
            Back to sign in
          </button>
        </div>
      )}
    </>
  )
}
