'use client'

import React from 'react'

interface FilterOption {
  value: string
  label: string
}

interface EventFilterTabsProps {
  selected: string
  onSelect: (value: string) => void
  options: FilterOption[]
  counts?: Record<string, number>
}

export function EventFilterTabs({ selected, onSelect, options, counts }: EventFilterTabsProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map((f) => (
        <button
          key={f.value}
          onClick={() => onSelect(f.value)}
          style={{
            padding: '5px 12px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 150ms',
            background: selected === f.value ? 'var(--color-brand)' : 'var(--color-surface-2)',
            color: selected === f.value ? 'white' : 'var(--color-text-muted)',
            border:
              selected === f.value
                ? '1px solid var(--color-brand)'
                : '1px solid var(--color-border)',
          }}
        >
          {f.label}
          {counts !== undefined && ` (${counts[f.value] ?? 0})`}
        </button>
      ))}
    </div>
  )
}
