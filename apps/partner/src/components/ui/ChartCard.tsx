'use client'

import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg, 16px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
            lineHeight: '1.3',
          }}
        >
          {title}
        </h3>

        {subtitle && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              lineHeight: '1.4',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: '20px',
        }}
      >
        {children}
      </div>
    </div>
  )
}