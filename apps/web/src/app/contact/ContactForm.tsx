'use client'

import React, { useState } from 'react'
import { Input, Button, ErrorMessage } from '@comfytag/ui'
import { api } from '@/lib/api'

interface FormData {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    try {
      // Try the backend endpoint first; fall back to Next.js API route
      try {
        await api.post('/contact', formData)
      } catch {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!response.ok) {
          const body = (await response.json()) as { error?: string }
          throw new Error(body.error ?? 'Failed to send message')
        }
      }

      setSuccess(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to send message. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <Input
        label="Your Name"
        value={formData.name}
        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        required
      />
      <Input
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
        required
      />
      <Input
        label="Subject"
        value={formData.subject}
        onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
        required
      />
      <div>
        <label
          htmlFor="contact-message"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '8px',
          }}
        >
          What's Up?
        </label>
        <textarea
          id="contact-message"
          value={formData.message}
          onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
          rows={5}
          required
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-public)',
            color: 'var(--color-text)',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && <ErrorMessage message={error} />}

      {success && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'var(--color-success)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Thanks for your message! We&apos;ll get back to you soon.
        </div>
      )}

      <Button type="submit" fullWidth loading={isSubmitting}>
        Send It
      </Button>
    </form>
  )
}
