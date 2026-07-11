import React from 'react'
import { colors } from '../tokens'

export interface BadgeProps {
  status: string
  className?: string
}

export function Badge({ status, className }: BadgeProps) {
  const token = colors.badges[status as keyof typeof colors.badges]
  const bg = token ? token.bg : 'var(--color-surface-2)'
  const text = token ? token.text : 'var(--color-text-muted)'
  const label = status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        backgroundColor: bg,
        color: text,
        transition: 'background-color var(--duration-micro) var(--ease-standard), color var(--duration-micro) var(--ease-standard)',
      }}
    >
      {label}
    </span>
  )
}
