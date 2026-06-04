'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { SSOButton, GoogleIcon, AppleIcon } from '@/components/auth/SSOButton'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

function RegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, confirm_password: confirmPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { message?: string }).message ?? 'Could not create account. Please try again.')
        return
      }
      const result = await signIn('credentials', { redirect: false, email, password })
      if (result?.error) {
        router.push('/login')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Heading */}
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
        Join ComfyTag
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
        Your next favourite event is waiting.
      </p>

      {/* SSO */}
      <SSOButton
        onClick={() => signIn('google', { callbackUrl })}
        icon={<GoogleIcon />}
        label="Continue with Google"
      />
      <SSOButton
        onClick={() => signIn('apple', { callbackUrl })}
        icon={<AppleIcon />}
        label="Continue with Apple"
        style={{ marginBottom: '24px' }}
      />

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>or register with email</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
      </div>

      {/* Register form */}
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '16px' }}>
          <Input id="name" label="Full name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <Input id="username" label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} placeholder="e.g. johndoe" required />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <Input id="confirm_password" label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required />
        </div>

        <Button type="submit" variant="primary" loading={isLoading} fullWidth>
          Create account
        </Button>
        {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
      </form>

      {/* Terms */}
      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
        By creating an account you agree to our{' '}
        <Link href="/terms" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>Privacy Policy</Link>.
      </p>

      {/* Login link */}
      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '22px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--color-brand)', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>
    </AuthLayout>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  )
}
