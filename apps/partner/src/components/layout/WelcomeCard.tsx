'use client'

import Link from 'next/link'

interface WelcomeCardProps {
  children: React.ReactNode
  headline: string
  subtitle: string
  maxWidth?: string
}

// Scan-frame mark — four corner brackets around a center dot, echoing the
// face-scan check-in that's ComfyTag's whole premise, without being a
// literal face icon.
function ScanMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-brand)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M20 8V5a1 1 0 0 0-1-1h-3" />
      <path d="M4 16v3a1 1 0 0 0 1 1h3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
      <circle cx="12" cy="12" r="2.5" fill="var(--color-text-on-brand)" stroke="none" />
    </svg>
  )
}

// Shared card shell for the whole first-run journey — register, login, and
// the one-time onboarding wizard all use this so the welcome experience
// reads as one continuous flow rather than three unrelated screens.
export function WelcomeCard({ children, headline, subtitle, maxWidth = '420px' }: WelcomeCardProps) {
  return (
    <div
      className="card-enter"
      style={{
        width: '100%',
        maxWidth,
        margin: '16px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '4px',
          background: 'linear-gradient(90deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)',
        }}
        aria-hidden="true"
      />

      <div style={{ padding: '40px' }}>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              background: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ScanMark />
          </div>
          <span style={{ fontFamily: 'var(--font-anybody)', fontSize: '17px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
            ComfyTag <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Partner</span>
          </span>
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-anybody)',
            fontWeight: 800,
            fontSize: '28px',
            lineHeight: 1.15,
            color: 'var(--color-text)',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          {headline}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            margin: '0 0 28px',
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>

        {children}
      </div>
    </div>
  )
}
