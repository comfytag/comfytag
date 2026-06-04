'use client'

interface InterestPickerProps {
  selected: string[]
  onChange: (interests: string[]) => void
}

const INTERESTS = ['Music', 'Comedy', 'Sports', 'Fashion', 'Food', 'Tech', 'Arts', 'Other']

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
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
        What event types interest you?
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 24px 0' }}>
        Select all that apply.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        {INTERESTS.map((interest) => (
          <button
            key={interest}
            onClick={() => handleToggle(interest)}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${selected.includes(interest) ? 'var(--color-brand)' : 'var(--color-border)'}`,
              background: selected.includes(interest) ? 'var(--color-brand)' : 'var(--color-surface)',
              color: selected.includes(interest) ? 'var(--color-text-on-brand)' : 'var(--color-text)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {interest}
          </button>
        ))}
      </div>
    </div>
  )
}
