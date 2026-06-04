'use client'

import type { User } from '@comfytag/types'

interface KycStatusHeaderProps {
  user: User | null
}

export function KycStatusHeader({ user }: KycStatusHeaderProps) {
  if (!user) return null

  const verifyData = user.isVerify || {}
  const completedCount = Object.values(verifyData).filter(Boolean).length
  const totalCount = 4 // photo, idCard front, idCard back, address
  const isFullyVerified = completedCount === totalCount

  const getProgressColor = (count: number): string => {
    if (count === 0) return 'var(--color-error)'
    if (count < 2) return 'var(--color-warning)'
    return 'var(--color-success)'
  }

  return (
    <div
      style={{
        backgroundColor: isFullyVerified ? 'var(--color-success)' : 'var(--color-warning)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '32px',
        color: 'white',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '8px',
            }}
          >
            {isFullyVerified
              ? 'KYC Verification Complete'
              : 'Complete Your KYC Verification'}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9,
              lineHeight: 1.4,
            }}
          >
            {isFullyVerified
              ? 'Your account is fully verified. You can withdraw without restrictions.'
              : `You have verified ${completedCount} of ${totalCount} documents. Complete the remaining to unlock full access.`}
          </p>
        </div>

        {/* Progress Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            whiteSpace: 'nowrap',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            {completedCount}/{totalCount}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          marginTop: '16px',
          height: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(completedCount / totalCount) * 100}%`,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  )
}
