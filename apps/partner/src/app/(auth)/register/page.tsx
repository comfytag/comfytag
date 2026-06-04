'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button, Input, ErrorMessage } from '@comfytag/ui'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Client-side validation
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
      // Register with isPartner: true
      const registerRes = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          confirm_password: confirmPassword,
          isPartner: true,
        }),
      })

      if (!registerRes.ok) {
        const data = await registerRes.json()
        setError(data.message || 'Registration failed')
        setIsLoading(false)
        return
      }

      setSuccess(true)

      // Auto sign in
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      setIsLoading(false)

      if (signInResult?.error) {
        setError('Registration successful but login failed. Please sign in manually.')
      } else if (signInResult?.ok) {
        router.push('/overview')
      }
    } catch (err) {
      setIsLoading(false)
      setError('An error occurred. Please try again.')
      console.error(err)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
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
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontWeight: 700, fontSize: '28px', color: 'var(--color-brand)', margin: 0 }}>
            ComfyTag
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>
            Partner Dashboard
          </p>
        </div>

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
            Create Account
          </Button>

          {error && (
            <div style={{ marginTop: '12px' }}>
              <ErrorMessage message={error} />
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
