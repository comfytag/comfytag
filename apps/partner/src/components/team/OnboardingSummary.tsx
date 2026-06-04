'use client'

interface OnboardingData {
  experience?: string
  team?: string
  event_per_year?: string
  event_turnout?: string
  interest?: string[]
}

interface OnboardingSummaryProps {
  onboarding?: OnboardingData
}

export function OnboardingSummary({ onboarding }: OnboardingSummaryProps) {
  if (!onboarding) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
          No onboarding data yet
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '32px',
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px 0' }}>
        Your Setup
      </h3>

      {/* Grid of info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {/* Experience */}
        {onboarding.experience && (
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Experience
            </p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
              {onboarding.experience}
            </p>
          </div>
        )}

        {/* Team Size */}
        {onboarding.team && (
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Team Size
            </p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
              {onboarding.team} people
            </p>
          </div>
        )}

        {/* Events Per Year */}
        {onboarding.event_per_year && (
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Events/Year
            </p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
              {onboarding.event_per_year}
            </p>
          </div>
        )}

        {/* Expected Turnout */}
        {onboarding.event_turnout && (
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Turnout
            </p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
              {onboarding.event_turnout}
            </p>
          </div>
        )}
      </div>

      {/* Interests */}
      {onboarding.interest && onboarding.interest.length > 0 && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Interests
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onboarding.interest.map((interest) => (
              <span
                key={interest}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  backgroundColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
