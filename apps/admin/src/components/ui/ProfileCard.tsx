'use client'

import { initials, formatDate } from '@comfytag/utils'

interface ProfileCardProps {
  name: string
  email: string
  phone?: string
  username?: string
  joinedAt?: string
  avatarUrl?: string
  children?: React.ReactNode
}

export function ProfileCard({
  name,
  email,
  phone,
  username,
  joinedAt,
  avatarUrl,
  children,
}: ProfileCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
        marginBottom: 24,
      }}
    >
      {/* Avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--color-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {initials(name)}
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>
          {name}
        </div>
        <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          {email}
        </div>
        {phone !== undefined && (
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            {phone || 'No phone on record'}
          </div>
        )}
        {username && (
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            @{username}
          </div>
        )}
        {joinedAt && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Joined {formatDate(joinedAt)}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
