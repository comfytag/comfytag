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
        gap: '8px',
        padding: '6px 12px',
        backgroundColor: 'var(--color-brand)',
        color: 'white',
        borderRadius: '9999px',
        fontSize: '13px',
      }}
    >
      {name}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
