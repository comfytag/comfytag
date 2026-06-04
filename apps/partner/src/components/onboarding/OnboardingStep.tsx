'use client'

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
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 24px 0' }}>
          {subtitle}
        </p>
      )}
      <div style={{ display: 'grid', gap: '12px' }}>
        {options.map((option) => (
          <label
            key={option}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              background: value === option ? 'var(--color-brand)' : 'var(--color-surface)',
              border: `2px solid ${value === option ? 'var(--color-brand)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="radio"
              name={title}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              style={{
                appearance: 'none',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid var(--color-border)',
                background: 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginRight: '12px',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: 500, color: value === option ? 'var(--color-text-on-brand)' : 'var(--color-text)' }}>
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
