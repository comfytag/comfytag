'use client'

import React from 'react'
import { Button } from '@comfytag/ui'
import { BottomSheet } from './BottomSheet'

export interface AuthGateSheetProps {
  isOpen: boolean
  onClose: () => void
  trigger: 'like' | 'comment' | 'hype-link' | 'checkout'
  redirectTo?: string
}

const COPY: Record<
  AuthGateSheetProps['trigger'],
  { emoji: string; title: string; subtitle: string }
> = {
  like: {
    emoji: '❤️',
    title: 'Save events you love',
    subtitle: 'Join ComfyTag to save events and share with friends.',
  },
  comment: {
    emoji: '💬',
    title: 'Join the conversation',
    subtitle: 'Log in to comment and connect with others going to this event.',
  },
  'hype-link': {
    emoji: '💰',
    title: 'Earn ₦500 per friend',
    subtitle:
      'Get your Hype Link and earn wallet credit when friends buy tickets.',
  },
  checkout: {
    emoji: '🎟️',
    title: 'Log in to buy tickets',
    subtitle: 'Create a free account to purchase tickets and access them anytime.',
  },
}

export function AuthGateSheet({
  isOpen,
  onClose,
  trigger,
  redirectTo,
}: AuthGateSheetProps) {
  const copy = COPY[trigger]
  const callbackUrl = redirectTo ?? '/'

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ paddingTop: '8px' }}>
        {/* Emoji icon */}
        <div
          style={{
            fontSize: '40px',
            textAlign: 'center',
            marginBottom: '12px',
          }}
          aria-hidden="true"
        >
          {copy.emoji}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            textAlign: 'center',
            color: 'var(--color-text)',
            marginBottom: '8px',
          }}
        >
          {copy.title}
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
        >
          {copy.subtitle}
        </p>

        {/* Continue with Google */}
        <a
          href={`/api/auth/signin?provider=google&callbackUrl=${encodeURIComponent(callbackUrl)}`}
          style={{ display: 'block', marginBottom: '10px', textDecoration: 'none' }}
        >
          <Button variant="primary" fullWidth>
            Continue with Google
          </Button>
        </a>

        {/* Magic link */}
        <a
          href={`/login?magic=1&callbackUrl=${encodeURIComponent(callbackUrl)}`}
          style={{ display: 'block', marginBottom: '20px', textDecoration: 'none' }}
        >
          <Button variant="ghost" fullWidth>
            Send me a magic link
          </Button>
        </a>

        {/* Already have account */}
        <div style={{ textAlign: 'center' }}>
          <a
            href="/login"
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              textDecoration: 'underline',
            }}
          >
            Already have an account?
          </a>
        </div>
      </div>
    </BottomSheet>
  )
}
