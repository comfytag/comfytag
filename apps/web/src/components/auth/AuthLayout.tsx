'use client'

import React from 'react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div
      suppressHydrationWarning
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {/* Centered card with brand gradient strip at top */}
      <div
        suppressHydrationWarning
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Brand gradient strip at top */}
        <div
          suppressHydrationWarning
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #7C3AED 0%, #5B21B6 100%)',
          }}
          aria-hidden="true"
        />

        {/* Logo & heading */}
        <div suppressHydrationWarning style={{ padding: '32px 24px' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
            }}
          >
            <div
              suppressHydrationWarning
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-text-on-brand)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 12V22H4V12" />
                <path d="M22 7H2v5h20V7z" />
                <path d="M12 22V7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text)',
                letterSpacing: '-0.01em',
              }}
            >
              ComfyTag
            </span>
          </Link>

          {title && (
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '8px',
              }}
            >
              {title}
            </h1>
          )}

          {/* Form content */}
          <div suppressHydrationWarning style={{ marginTop: '24px' }}>{children}</div>
        </div>
      </div>
    </div>
  )
}
