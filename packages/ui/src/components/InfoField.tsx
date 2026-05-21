import React from 'react'

export interface InfoFieldProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function InfoField({ label, value, className }: InfoFieldProps) {
  return (
    <div className={className}>
      <div
        style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--color-text)' }}>
        {value}
      </div>
    </div>
  )
}
