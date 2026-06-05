'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { AuthLayout } from '@/components/auth/AuthLayout'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

function maskIdentifier(value: string): string {
  if (value.includes('@')) {
    const [local, domain] = value.split('@')
    return `${local.slice(0, 2)}***@${domain}`
  }
  return `${value.slice(0, 3)}***${value.slice(-4)}`
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resetToken, setResetToken] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))
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

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp: otp.join('') }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { message?: string }).message ?? 'Invalid code. Please try again.')
      } else {
        const data = await res.json().catch(() => ({}))
        setResetToken((data as { resetToken?: string }).resetToken ?? '')
        setStep(3)
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
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
        router.push('/login?success=1')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    const char = value.replace(/[^0-9a-zA-Z]/g, '').slice(-1)
    const updated = [...otp]
    updated[index] = char
    setOtp(updated)
    if (char && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const stepTitles = ['Reset your password', 'Enter verification code', 'Set new password']
  const stepSubtitles = [
    'Enter your email or phone to receive a one-time code.',
    `Sent to ${maskIdentifier(identifier)}`,
    'Choose a strong password — min. 8 characters.',
  ]

  return (
    <AuthLayout>
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

      <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
        {stepTitles[step - 1]}
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
        {stepSubtitles[step - 1]}
      </p>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleStep1}>
          <div style={{ marginBottom: '24px' }}>
            <Input id="identifier" label="Email or phone number" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 08012345678" required />
          </div>
          <Button type="submit" variant="primary" loading={isLoading} fullWidth>
            Send code
          </Button>
          {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handleStep2}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                style={{
                  width: '46px',
                  height: '54px',
                  background: 'var(--color-surface-2)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                }}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {resendCooldown > 0 ? (
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => { const ok = await sendOtp(); if (ok) { setOtp(Array(6).fill('')); startCooldown() } }}
                disabled={isLoading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-brand)', padding: 0 }}
              >
                Resend code
              </button>
            )}
          </div>

          <Button type="submit" variant="primary" loading={isLoading} disabled={otp.some((d) => !d)} fullWidth>
            Verify code
          </Button>
          {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
        </form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <form onSubmit={handleStep3}>
          <div style={{ marginBottom: '16px' }}>
            <Input id="newPassword" label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" required />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <Input id="confirmPassword" label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
          </div>
          <Button type="submit" variant="primary" loading={isLoading} fullWidth>
            Reset password
          </Button>
          {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
        </form>
      )}
    </AuthLayout>
  )
}
