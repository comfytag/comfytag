'use client'

interface IsVerify {
  photo?: boolean
  idCard?: boolean
  address?: boolean
}

interface OrganizerProfileCardProps {
  name: string
  username: string
  avatar?: string | null
  isVerify?: IsVerify
}

export function OrganizerProfileCard({ name, username, avatar, isVerify }: OrganizerProfileCardProps) {
  const verificationBadges = []
  if (isVerify?.photo) verificationBadges.push('Photo')
  if (isVerify?.idCard) verificationBadges.push('ID Card')
  if (isVerify?.address) verificationBadges.push('Address')

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      marginBottom: '32px',
    }}>
      {/* Avatar + Info */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: avatar ? 'transparent' : 'var(--color-brand)',
            color: 'var(--color-text-on-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 700,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
              }}
            />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
            {name}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            @{username}
          </p>
        </div>
      </div>

      {/* Verification badges */}
      {verificationBadges.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {verificationBadges.map((badge) => (
            <span
              key={badge}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                backgroundColor: 'var(--color-success)',
                color: 'var(--color-text-on-brand)',
              }}
            >
              ✓ {badge}
            </span>
          ))}
        </div>
      )}
      {verificationBadges.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
          No verifications yet
        </p>
      )}
    </div>
  )
}
