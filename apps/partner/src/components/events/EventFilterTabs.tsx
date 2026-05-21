'use client'

import { useState } from 'react'

interface TabOption {
  label: string
  value: string
}

interface EventFilterTabsProps {
  active: string
  onChange: (tab: string) => void
  tabs: TabOption[]
}

export function EventFilterTabs({ active, onChange, tabs }: EventFilterTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  return (
    <div
      style={{
        display: 'flex',
        gap: '0',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value
        const isHovered = hoveredTab === tab.value

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            onMouseEnter={() => setHoveredTab(tab.value)}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? '2px solid var(--color-brand)'
                : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive
                ? 'var(--color-brand)'
                : isHovered
                  ? 'var(--color-text)'
                  : 'var(--color-text-muted)',
              transition: 'color 150ms, border-color 150ms',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}