'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoadingSpinner } from '@comfytag/ui'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

type VerifyStatus = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [status, setStatus] = useState<VerifyStatus>('loading')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(3)

  const didRun = useRef(false)

  useEffect(() => {
    // Prevent double-execution in React strict mode
    if (didRun.current) return
    didRun.current = true

    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please request a new link.')
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/magic-link?token=${encodeURIComponent(token!)}`)
        const data = (await res.json()) as { success?: boolean; message?: string; email?: string }

        if (!res.ok || !data.success) {
          setStatus('error')
          setMessage(data.message ?? 'Verification failed. Please request a new link.')
          return
        }

        setStatus('success')
        setMessage('Email verified! Redirecting you to your tickets…')
      } catch {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    void verify()
  }, [searchParams])

  // Countdown and redirect on success
  useEffect(() => {
    if (status !== 'success') return

    if (countdown <= 0) {
      router.push('/tickets')
      return
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [status, countdown, router])

  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: 'calc(100vh - 120px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 440,
            width: '100%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            padding: '40px 32px',
            textAlign: 'center',
          }}
        >
          {status === 'loading' && (
            <>
              <LoadingSpinner size="lg" centered />
              <p
                style={{
                  marginTop: 20,
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                }}
              >
                Verifying your email…
              </p>
              <p
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: 'var(--color-text-muted)',
                }}
              >
                Please wait a moment.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div
                style={{ fontSize: 48, marginBottom: 16 }}
                role="img"
                aria-label="Success"
              >
                ✅
              </div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  margin: '0 0 8px',
                }}
              >
                Email Verified!
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--color-text-muted)',
                  margin: '0 0 24px',
                }}
              >
                {message}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-muted)',
                }}
              >
                Redirecting in{' '}
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--color-brand)',
                  }}
                >
                  {countdown}s
                </span>
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div
                style={{ fontSize: 48, marginBottom: 16 }}
                role="img"
                aria-label="Error"
              >
                ❌
              </div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  margin: '0 0 8px',
                }}
              >
                Verification Failed
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--color-text-muted)',
                  margin: '0 0 28px',
                  lineHeight: 1.5,
                }}
              >
                {message}
              </p>
              <Link
                href="/login"
                style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  background: 'var(--color-brand)',
                  color: '#ffffff',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
