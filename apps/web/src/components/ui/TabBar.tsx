import React from 'react'

export interface Tab {
  label: string
  value: string
  count?: number
}

export interface TabBarProps {
  tabs: Tab[]
  activeTab: string
  onChange: (value: string) => void
  variant?: 'pill' | 'underline'
}

export function TabBar({ tabs, activeTab, onChange, variant = 'pill' }: TabBarProps) {
  if (variant === 'underline') {
    return (
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            style={{
              padding: '12px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === tab.value ? 'var(--color-text)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab.value ? '2px solid var(--color-brand)' : 'none',
              transition: 'color 150ms, border-color 150ms',
            }}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          style={{
            padding: '8px 18px',
            borderRadius: '99px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            background: activeTab === tab.value ? 'var(--color-brand)' : 'var(--color-surface-2)',
            color: activeTab === tab.value ? 'var(--color-text-on-brand)' : 'var(--color-text-muted)',
            transition: 'background 150ms, color 150ms',
          }}
        >
          {tab.label}
          {tab.count !== undefined && ` (${tab.count})`}
        </button>
      ))}
    </div>
  )
}
