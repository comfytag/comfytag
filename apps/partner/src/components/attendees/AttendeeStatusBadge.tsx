'use client'

interface AttendeeStatusBadgeProps {
  status: 'active' | 'used' | 'transferred' | 'refunded' | 'ended'
}

export function AttendeeStatusBadge({ status }: AttendeeStatusBadgeProps) {
  const statusConfig = {
    active: {
      bg: 'rgba(16, 185, 129, 0.15)',
      color: 'var(--color-success)',
      label: 'Active',
    },
    used: {
      bg: 'rgba(99, 102, 241, 0.15)',
      color: 'rgb(99, 102, 241)',
      label: 'Used',
    },
    transferred: {
      bg: 'rgba(168, 162, 158, 0.15)',
      color: 'var(--color-text-muted)',
      label: 'Transferred',
    },
    refunded: {
      bg: 'rgba(239, 68, 68, 0.15)',
      color: 'var(--color-error)',
      label: 'Refunded',
    },
    ended: {
      bg: 'rgba(156, 163, 175, 0.15)',
      color: 'rgb(107, 114, 128)',
      label: 'Ended',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  )
}
