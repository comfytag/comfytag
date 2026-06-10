'use client'

import { useState, useEffect } from 'react'
import type { User } from '@comfytag/types'

export interface FaceEnrollmentBannerProps {
  user: User
  onDismiss: () => void
}

export function FaceEnrollmentBanner({ user, onDismiss }: FaceEnrollmentBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Check if user has dismissed this banner
    const isDismissed = localStorage.getItem('face-enrollment-banner-dismissed')
    if (isDismissed) {
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('face-enrollment-banner-dismissed', 'true')
    onDismiss()
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
          Face Check-In — Coming Soon
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-muted)',
            lineHeight: 1.4,
          }}
        >
          Skip the queue with your face — no QR code needed. Launching soon on the ComfyTag app.
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
            flexShrink: 0,
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
          aria-label="Dismiss face enrollment coming soon banner"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
