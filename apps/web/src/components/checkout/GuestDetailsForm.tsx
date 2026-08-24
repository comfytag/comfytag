'use client'

import React, { useState } from 'react'
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
    <form id="guest-checkout-form" onSubmit={handleSubmit} className="space-y-4 mb-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Your details
      </p>

      {/* Full Name */}
      <div>
        <label
          htmlFor="guest-name"
          className="block text-sm font-semibold text-foreground mb-1.5"
        >
          Full Name
        </label>
        <input
          id="guest-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tolu Adeyemi"
          disabled={loading}
          required
          className="w-full bg-muted border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all disabled:opacity-50"
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1.5">{errors.name}</p>
        )}
      </div>

      {/* Email Address */}
      <div>
        <label
          htmlFor="guest-email"
          className="block text-sm font-semibold text-foreground mb-1.5"
        >
          Email Address
        </label>
        <input
          id="guest-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. tolu@email.com"
          disabled={loading}
          required
          className="w-full bg-muted border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all disabled:opacity-50"
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1.5">{errors.email}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <label
          htmlFor="guest-phone"
          className="block text-sm font-semibold text-foreground mb-1.5"
        >
          Phone Number
        </label>
        <input
          id="guest-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 08012345678"
          disabled={loading}
          required
          className="w-full bg-muted border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          We&apos;ll send your ticket confirmation to this number via SMS
        </p>
        {errors.phone && (
          <p className="text-xs text-destructive mt-1">{errors.phone}</p>
        )}
      </div>
    </form>
  )
}
