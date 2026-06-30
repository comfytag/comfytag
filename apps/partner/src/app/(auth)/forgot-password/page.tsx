'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { OtpInput } from '@/components/ui/OtpInput'
import { api } from '@/lib/api'

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
      await api.post('/partner/auth/forgot-password', { identifier })
      return true
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Network error. Please try again.')
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

  async function handleResend() {
    const ok = await sendOtp()
    if (ok) { setOtp(Array(6).fill('')); startCooldown() }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const { data } = await api.post<{ resetToken?: string }>(
        '/partner/auth/verify-otp',
        { identifier, otp: otp.join('') }
      )
      setResetToken(data.resetToken ?? '')
      setStep(3)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setIsLoading(true)
    setError('')
    try {
      await api.post('/partner/auth/reset-password', { identifier, resetToken, newPassword })
      router.push('/login?success=1')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function goBack() {
    setError('')
    setStep((step - 1) as 1 | 2 | 3)
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
          position: 'relative',
        }}
      >
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {step === 1 && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontWeight: 700, fontSize: '22px', color: 'var(--color-text)', margin: 0 }}>
                Reset your password
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px', marginBottom: 0 }}>
                Enter your email or phone number to receive an OTP
              </p>
            </div>
            <form onSubmit={handleStep1}>
              <div style={{ marginBottom: '24px' }}>
                <Input
                  id="identifier"
                  label="Email or phone number"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@example.com or 08012345678"
                  required
                />
              </div>
              <Button type="submit" variant="primary" loading={isLoading} fullWidth>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Button>
              {error && (
                <div style={{ marginTop: '8px' }}>
                  <ErrorMessage message={error} />
                </div>
              )}
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: '32px', paddingTop: '16px' }}>
              <h1 style={{ fontWeight: 700, fontSize: '22px', color: 'var(--color-text)', margin: 0 }}>
                Enter verification code
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px', marginBottom: 0 }}>
                Sent to {maskIdentifier(identifier)}
              </p>
            </div>
            <form onSubmit={handleStep2}>
              <div style={{ marginBottom: '20px' }}>
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '13px' }}>
                {resendCooldown > 0 ? (
                  <span style={{ color: 'var(--color-text-muted)' }}>Resend in {resendCooldown}s</span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={isLoading}
                    disabled={resendCooldown > 0}
                    onClick={handleResend}
                  >
                    Resend OTP
                  </Button>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={otp.some((d) => !d)}
                fullWidth
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
              {error && (
                <div style={{ marginTop: '8px' }}>
                  <ErrorMessage message={error} />
                </div>
              )}
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ marginBottom: '32px', paddingTop: '16px' }}>
              <h1 style={{ fontWeight: 700, fontSize: '22px', color: 'var(--color-text)', margin: 0 }}>
                Set new password
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px', marginBottom: 0 }}>
                Choose a strong password (min. 8 characters)
              </p>
            </div>
            <form onSubmit={handleStep3}>
              <div style={{ marginBottom: '20px' }}>
                <Input
                  id="newPassword"
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <Input
                  id="confirmPassword"
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                />
              </div>

              <Button type="submit" variant="primary" loading={isLoading} fullWidth>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
              {error && (
                <div style={{ marginTop: '8px' }}>
                  <ErrorMessage message={error} />
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
