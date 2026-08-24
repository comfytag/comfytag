'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { api } from '@/lib/api'

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name || !username || !email || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      await api.post('/auth/register-partner', {
        name,
        username,
        email,
        password,
        confirm_password: confirmPassword,
      })

      router.push(`/login?registered=true&email=${encodeURIComponent(email)}`)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } }
      if (e.response?.status === 409) {
        setError('An account with this email already exists. Sign in instead — if it\'s an attendee account, use "Sign in with Google" or upgrade it from your profile on the ComfyTag app.')
      } else {
        setError(e.response?.data?.message ?? 'Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '20px' }}>
        <Input
          id="name"
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          required
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <Input
          id="username"
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="johndoe"
          required
        />
      </div>

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

      <div style={{ marginBottom: '20px' }}>
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

      <div style={{ marginBottom: '24px' }}>
        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" variant="primary" loading={isLoading} fullWidth>
        Create your organizer account
      </Button>

      {error && (
        <div style={{ marginTop: '12px' }}>
          <ErrorMessage message={error} />
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
        Already selling tickets with us?{' '}
        <a href="/login" style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 600 }}>
          Sign in
        </a>
      </p>
    </form>
  )
}
