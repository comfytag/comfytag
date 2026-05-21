'use client'

import React from 'react'
import { List, LayoutGrid } from 'lucide-react'

interface ViewToggleProps {
  view: 'table' | 'grid'
  onViewChange: (view: 'table' | 'grid') => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => onViewChange('table')}
        style={{
          background: 'none',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '7px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: view === 'table' ? 'var(--color-brand)' : 'var(--color-text-muted)',
        }}
      >
        <List size={18} />
      </button>
      <button
        onClick={() => onViewChange('grid')}
        style={{
          background: 'none',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '7px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: view === 'grid' ? 'var(--color-brand)' : 'var(--color-text-muted)',
        }}
      >
        <LayoutGrid size={18} />
      </button>
    </div>
  )
}
