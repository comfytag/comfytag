'use client'

import { Music, Drama, Trophy, Shirt, UtensilsCrossed, Cpu, Palette, MoreHorizontal, type LucideIcon } from 'lucide-react'

interface InterestPickerProps {
  selected: string[]
  onChange: (interests: string[]) => void
}

const INTERESTS: { label: string; icon: LucideIcon }[] = [
  { label: 'Music', icon: Music },
  { label: 'Comedy', icon: Drama },
  { label: 'Sports', icon: Trophy },
  { label: 'Fashion', icon: Shirt },
  { label: 'Food', icon: UtensilsCrossed },
  { label: 'Tech', icon: Cpu },
  { label: 'Arts', icon: Palette },
  { label: 'Other', icon: MoreHorizontal },
]

export function InterestPicker({ selected, onChange }: InterestPickerProps) {
  const handleToggle = (interest: string) => {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest))
    } else {
      onChange([...selected, interest])
    }
  }

  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontFamily: 'var(--font-anybody)', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
        What event types interest you?
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 24px 0' }}>
        Select all that apply.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        {INTERESTS.map(({ label, icon: Icon }) => {
          const isSelected = selected.includes(label)
          return (
            <button
              key={label}
              onClick={() => handleToggle(label)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isSelected ? 'var(--color-brand)' : 'var(--color-border)'}`,
                background: isSelected ? 'var(--color-brand)' : 'var(--color-surface-2)',
                color: isSelected ? 'var(--color-text-on-brand)' : 'var(--color-text)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: `background var(--duration-fast) ease, border-color var(--duration-fast) ease`,
              }}
            >
              <Icon size={20} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
