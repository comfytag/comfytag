'use client'

import { useState, useEffect } from 'react'
import type { User } from '@comfytag/types'

export interface FaceEnrollmentBannerProps {
  user: User
  onDismiss: () => void
  onSetup: () => void
}

export function FaceEnrollmentBanner({ user, onDismiss, onSetup }: FaceEnrollmentBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show if user hasn't enrolled face
    if (user.faceEnrolled) {
      setIsVisible(false)
      return
    }

    // Check if user has dismissed this banner
    const isDismissed = localStorage.getItem('face-enrollment-banner-dismissed')
    if (!isDismissed) {
      setIsVisible(true)
    }
  }, [user.faceEnrolled])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('face-enrollment-banner-dismissed', 'true')
    onDismiss()
  }

  const handleSetup = () => {
    setIsVisible(false)
    onSetup()
  }

  if (!isVisible) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 20px',
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
        borderRadius: 'var(--radius-md)',
        marginBottom: 20,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: 4,
          }}
        >
          Set up face check-in
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-muted)',
            lineHeight: 1.4,
          }}
        >
          Your face is your ticket. 30 seconds.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleSetup}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            background: 'var(--color-brand)',
            color: 'var(--color-text-on-brand)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: `background var(--duration-fast) var(--ease-standard)`,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-brand-dark)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-brand)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = `2px solid var(--color-brand)`
            e.currentTarget.style.outlineOffset = '2px'
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none'
          }}
        >
          Set up <span aria-hidden="true">→</span>
        </button>

        <button
          onClick={handleDismiss}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            background: 'var(--color-surface-2)',
            border: `1px solid var(--color-border)`,
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 16,
            color: 'var(--color-text-muted)',
            transition: `background var(--duration-fast) var(--ease-standard)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-2)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = `2px solid var(--color-brand)`
            e.currentTarget.style.outlineOffset = '2px'
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none'
          }}
          aria-label="Dismiss face enrollment banner"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
