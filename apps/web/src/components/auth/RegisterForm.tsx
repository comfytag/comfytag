'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { SSOButton, GoogleIcon } from './SSOButton'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

export interface RegisterFormProps {
  onSwitchToLogin: () => void
  /** Called with the registered email on success. If omitted, redirects to /login?registered=true. */
  onSuccess?: (email: string) => void
  callbackUrl?: string
}

export function RegisterForm({ onSwitchToLogin, onSuccess, callbackUrl = '/' }: RegisterFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
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
        if (res.status === 409) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError((data as { message?: string }).message ?? 'Could not create account. Please try again.')
        }
        return
      }
      if (onSuccess) {
        onSuccess(email)
      } else {
        router.push(`/login?registered=true&email=${encodeURIComponent(email)}`)
        router.refresh()
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
        Join ComfyTag
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
        Your next favourite event is waiting.
      </p>

      <SSOButton
        onClick={() => signIn('google', { callbackUrl })}
        icon={<GoogleIcon />}
        label="Continue with Google"
        style={{ marginBottom: '20px' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>or register with email</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
      </div>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '14px' }}>
          <Input id="rf-name" label="Full name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <Input id="rf-username" label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))} placeholder="e.g. johndoe" required />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <Input id="rf-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <Input id="rf-password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <Input id="rf-confirm-password" label="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required />
        </div>
        <Button type="submit" variant="primary" loading={isLoading} fullWidth>
          Create account
        </Button>
        {error && <div style={{ marginTop: '10px' }}><ErrorMessage message={error} /></div>}
      </form>

      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '14px', lineHeight: 1.5 }}>
        By creating an account you agree to our{' '}
        <Link href="/terms" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>Privacy Policy</Link>.
      </p>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '18px' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brand)', fontWeight: 600, fontSize: '14px', padding: 0 }}
        >
          Sign in
        </button>
      </div>
    </>
  )
}
