'use client'

import React from 'react'

interface SectionCardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function SectionCard({ children, style }: SectionCardProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '24px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
