'use client'

import React, { useState, useRef, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@comfytag/ui'

interface VerifyEmailFormProps {
  email: string
  password: string
  onSuccess: () => void
  onBack: () => void
  callbackUrl?: string
}

export function VerifyEmailForm({
  email,
  password,
  onSuccess,
  onBack,
  callbackUrl = '/',
}: VerifyEmailFormProps) {
  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [resendStatus, setResendStatus] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleVerify = async (code: string) => {
    if (code.length < 6 || isVerifying) return
    setIsVerifying(true)
    setError('')
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'}/auth/verify-email-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: code }),
        }
      )
      const data = await res.json().catch(() => ({})) as { message?: string }
      if (!res.ok) {
        setError(data.message || 'Invalid verification code. Please try again.')
        setIsVerifying(false)
        return
      }
      // Verified — sign in automatically
      const result = await signIn('credentials', { redirect: false, email, password, callbackUrl })
      if (result?.error) {
        setError('Verified! Please sign in manually.')
        setIsVerifying(false)
        onBack()
        return
      }
      onSuccess()
    } catch {
      setError('Network error. Please try again.')
      setIsVerifying(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
    setOtp(digits)
    setError('')
    if (digits.length === 6) handleVerify(digits)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    setOtp(digits)
    setError('')
    if (digits.length === 6) handleVerify(digits)
  }

  const handleResend = async () => {
    if (!email || isResending) return
    setIsResending(true)
    setResendStatus(null)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({})) as { message?: string }
      setResendStatus(
        res.ok
          ? 'Code resent! Check your inbox.'
          : (data.message ?? 'Failed to resend. Please try again.')
      )
    } catch {
      setResendStatus('Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
        Check your email
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
        We sent a 6-digit code to
      </p>
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '28px', wordBreak: 'break-all' }}>
        {email}
      </p>

      {/* Single OTP input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={handleChange}
        onPaste={handlePaste}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="000000"
        aria-label="6-digit verification code"
        style={{
          width: '100%',
          height: '56px',
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '0.35em',
          textAlign: 'center',
          background: 'var(--color-surface-2)',
          border: `1.5px solid ${error ? 'var(--color-error)' : focused ? 'var(--color-brand)' : 'var(--color-border)'}`,
          borderRadius: '12px',
          color: 'var(--color-text)',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          boxShadow: focused && !error ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
          marginBottom: '8px',
        }}
      />

      {error && (
        <p style={{ fontSize: '13px', color: 'var(--color-error)', marginBottom: '12px', textAlign: 'center' }}>
          {error}
        </p>
      )}

      <div style={{ marginBottom: '12px', marginTop: error ? 0 : '4px' }}>
        <Button
          type="button"
          variant="primary"
          loading={isVerifying}
          disabled={otp.length < 6 || isVerifying}
          fullWidth
          onClick={() => handleVerify(otp)}
        >
          Verify email
        </Button>
      </div>

      {/* Resend */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {resendStatus ? (
          <p style={{ fontSize: '13px', margin: 0, color: resendStatus.includes('resent') ? 'var(--color-success)' : 'var(--color-error)' }}>
            {resendStatus}
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            style={{ background: 'none', border: 'none', cursor: isResending ? 'default' : 'pointer', fontSize: '13px', color: 'var(--color-brand)', textDecoration: 'underline', padding: 0, opacity: isResending ? 0.6 : 1 }}
          >
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>

      {/* Back */}
      <div style={{ textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-muted)', padding: 0 }}
        >
          ← Back to sign in
        </button>
      </div>
    </>
  )
}
