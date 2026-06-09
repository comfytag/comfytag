'use client'

import React, { useState } from 'react'
import { Input } from '@comfytag/ui'
import { isValidEmail, isValidNigerianPhone } from '@comfytag/utils'

export interface GuestDetails {
  name: string
  email: string
  phone: string
}

interface GuestDetailsFormProps {
  onSubmit: (details: GuestDetails) => void | Promise<void>
  loading?: boolean
}

export function GuestDetailsForm({ onSubmit, loading = false }: GuestDetailsFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Full name is required'
    if (!isValidEmail(email)) newErrors.email = 'Enter a valid email address'
    if (!isValidNigerianPhone(phone)) newErrors.phone = 'Enter a valid Nigerian phone number'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    await onSubmit({ name, email, phone })
  }

  return (
    <form id="guest-checkout-form" onSubmit={handleSubmit}>
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <p
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Your details
        </p>

        <Input
          label="Full Name"
          id="guest-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tolu Adeyemi"
          error={errors.name}
          disabled={loading}
          required
        />

        <Input
          label="Email Address"
          id="guest-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. tolu@email.com"
          error={errors.email}
          disabled={loading}
          required
        />

        <div>
          <Input
            label="Phone Number"
            id="guest-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 08012345678"
            error={errors.phone}
            disabled={loading}
            required
          />
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              margin: '6px 0 0',
            }}
          >
            We'll send your ticket confirmation to this number via SMS
          </p>
        </div>
      </div>
    </form>
  )
}
