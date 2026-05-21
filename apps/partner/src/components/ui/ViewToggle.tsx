'use client'

import React from 'react'
import { List, LayoutGrid } from 'lucide-react'

interface ViewToggleProps {
  view: 'table' | 'grid'
  onViewChange: (view: 'table' | 'grid') => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  const [hoveredBtn, setHoveredBtn] = React.useState<'table' | 'grid' | null>(null)

  function getButtonStyle(btn: 'table' | 'grid'): React.CSSProperties {
    const isActive = view === btn
    const isHovered = hoveredBtn === btn

    if (isActive) {
      return {
        background: 'var(--color-brand)',
        border: '1px solid var(--color-brand)',
        borderRadius: '8px',
        padding: '7px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-on-brand)',
        transition: 'background var(--duration-fast) ease, border-color var(--duration-fast) ease',
      }
    }

    return {
      background: isHovered ? 'var(--color-surface)' : 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      padding: '7px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-text-muted)',
      transition: 'background var(--duration-fast) ease',
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => onViewChange('table')}
        onMouseEnter={() => setHoveredBtn('table')}
        onMouseLeave={() => setHoveredBtn(null)}
        style={getButtonStyle('table')}
        aria-label="Table view"
        aria-pressed={view === 'table'}
      >
        <List size={18} />
      </button>
      <button
        onClick={() => onViewChange('grid')}
        onMouseEnter={() => setHoveredBtn('grid')}
        onMouseLeave={() => setHoveredBtn(null)}
        style={getButtonStyle('grid')}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
      >
        <LayoutGrid size={18} />
      </button>
    </div>
  )
}
