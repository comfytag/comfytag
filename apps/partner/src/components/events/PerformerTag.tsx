'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'

interface PerformerTagProps {
  name: string
  onRemove: () => void
}

export function PerformerTag({ name, onRemove }: PerformerTagProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
        padding: 'var(--spacing-1-5) var(--spacing-3)',
        backgroundColor: 'var(--color-brand)',
        color: 'var(--color-text-on-brand)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      {name}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-on-brand)',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          opacity: 0.8,
          transition: 'opacity 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
