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
        // NEW: Glass morphism dark variant
        backgroundColor: 'rgba(26, 26, 26, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-lg, 16px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all var(--duration-fast) ease',
        boxShadow: '0 0 20px rgba(124, 58, 237, 0.1)',
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
            fontFamily: 'var(--font-anybody), sans-serif', // NEW: Bold Anybody font
            margin: 0,
            fontSize: '16px',
            fontWeight: 800,
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