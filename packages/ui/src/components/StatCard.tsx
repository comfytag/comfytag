import React from 'react'
import { Skeleton } from './Skeleton'

export interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  value: string | number
  label: string
  isLoading?: boolean
}

export function StatCard({ icon: Icon, value, label, isLoading }: StatCardProps) {
  return (
    <div
      style={{
        // v2.0: flat surface + border, no glass/glow — see design.md "Elevation via Border + Contrast"
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        transition: 'border-color var(--duration-micro) ease, background-color var(--duration-micro) ease',
      }}
    >
      <div>
        {isLoading ? (
          <Skeleton width={60} height={14} />
        ) : (
          <div
            style={{
              fontFamily: 'var(--font-label), sans-serif', // NEW: Space Grotesk labels
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </div>
        )}
        {isLoading ? (
          <div style={{ marginTop: '8px' }}>
            <Skeleton width={80} height={28} />
          </div>
        ) : (
          <div
            style={{
              fontFamily: 'var(--font-anybody), sans-serif', // NEW: Bold Anybody font
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--color-text)',
            }}
          >
            {value}
          </div>
        )}
      </div>

      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'var(--color-surface-2)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-brand)',
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
    </div>
  )
}
