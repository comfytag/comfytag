'use client'

import { Check } from 'lucide-react'

interface OnboardingStepProps {
  title: string
  subtitle?: string
  options: string[]
  value: string
  onChange: (value: string) => void
}

export function OnboardingStep({ title, subtitle, options, value, onChange }: OnboardingStepProps) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontFamily: 'var(--font-anybody)', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 24px 0' }}>
          {subtitle}
        </p>
      )}
      <div style={{ display: 'grid', gap: '12px' }}>
        {options.map((option) => {
          const selected = value === option
          return (
            <label
              key={option}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: selected ? 'var(--color-brand)' : 'var(--color-surface-2)',
                border: `1px solid ${selected ? 'var(--color-brand)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: `background var(--duration-fast) ease, border-color var(--duration-fast) ease`,
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, color: selected ? 'var(--color-text-on-brand)' : 'var(--color-text)' }}>
                {option}
              </span>
              <input
                type="radio"
                name={title}
                value={option}
                checked={selected}
                onChange={(e) => onChange(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              {selected && <Check size={18} color="var(--color-text-on-brand)" />}
            </label>
          )
        })}
      </div>
    </div>
  )
}
