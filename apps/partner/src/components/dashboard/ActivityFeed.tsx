'use client'

import { useMemo } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityItem {
  id: string
  type: 'purchase' | 'comment' | 'warning'
  description: string
  timestamp: Date | string
  metadata?: Record<string, string | number>
}

export interface ActivityFeedProps {
  activities: ActivityItem[]
  live?: boolean
  title?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'purchase':
      return '✅'
    case 'comment':
      return '💬'
    case 'warning':
      return '⚠️'
  }
}

function formatRelativeTime(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = Date.now()
  const diffMs = now - date.getTime()

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ActivityRowProps {
  item: ActivityItem
}

function ActivityRow({ item }: ActivityRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'default',
        transition: `background var(--duration-default, 250ms) ease`,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-2)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
      }}
    >
      {/* Icon */}
      <span
        style={{
          fontSize: '16px',
          lineHeight: 1,
          flexShrink: 0,
          width: '20px',
          textAlign: 'center',
        }}
        aria-hidden="true"
      >
        {getIcon(item.type)}
      </span>

      {/* Description */}
      <span
        style={{
          flex: 1,
          fontSize: '13px',
          color: 'var(--color-text)',
          lineHeight: '1.4',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={item.description}
      >
        {item.description}
      </span>

      {/* Timestamp */}
      <span
        style={{
          flexShrink: 0,
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        {formatRelativeTime(item.timestamp)}
      </span>
    </div>
  )
}

function LiveBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: '#10B981',            // success green — semantic value, not brand colour
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderRadius: '100px',
        padding: '2px 8px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
        aria-hidden="true"
      />
      LIVE
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ActivityFeed({
  activities,
  live = false,
  title = 'Recent Activity',
}: ActivityFeedProps) {
  // Stable sort: most recent first (avoids mutating the prop array)
  const sorted = useMemo(
    () =>
      [...activities].sort((a, b) => {
        const tA = new Date(a.timestamp).getTime()
        const tB = new Date(b.timestamp).getTime()
        return tB - tA
      }),
    [activities],
  )

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg, 16px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}
        >
          {title}
        </h3>

        {live && <LiveBadge />}
      </div>

      {/* Body */}
      <div
        style={{
          maxHeight: '360px',
          overflowY: 'auto',
        }}
        role="feed"
        aria-label={title}
        aria-live={live ? 'polite' : 'off'}
        aria-atomic="false"
      >
        {sorted.length === 0 ? (
          <div
            style={{
              padding: '40px 16px',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--color-text-muted)',
            }}
          >
            No recent activity
          </div>
        ) : (
          sorted.map((item) => <ActivityRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}