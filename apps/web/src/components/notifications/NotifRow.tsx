import type { Notification, NotificationType } from '@comfytag/types'
import { authHeader } from '@comfytag/utils'
import api from '@/lib/api'

interface NotifRowProps {
  notif: Notification
  onRead: (id: string) => void
  token: string
}

const TYPE_ICON: Record<NotificationType, string> = {
  ticket_confirmed: '🎟️',
  transfer_received: '🎟️',
  transfer_accepted: '🎟️',
  transfer_declined: '🎟️',
  event_reminder: '🔔',
  new_event_from_following: '❤️',
  payout_approved: '💳',
  payout_rejected: '💳',
  kyc_approved: '👤',
  kyc_rejected: '👤',
}

function typeIcon(type: NotificationType): string {
  return TYPE_ICON[type] ?? '🔔'
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function NotifRow({ notif, onRead, token }: NotifRowProps) {
  function handleClick() {
    if (notif.read) return
    onRead(notif._id)
    api
      .put(`/notifications/${notif._id}/read`, null, authHeader(token))
      .catch(() => {})
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        borderLeft: notif.read ? '3px solid transparent' : '3px solid var(--color-brand)',
        background: notif.read ? 'transparent' : 'rgba(124, 58, 237, 0.04)',
        cursor: notif.read ? 'default' : 'pointer',
        outline: 'none',
      }}
    >
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        flexShrink: 0,
      }}>
        {typeIcon(notif.type)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14,
          fontWeight: notif.read ? 400 : 700,
          color: 'var(--color-text)',
          margin: '0 0 2px',
          lineHeight: 1.4,
        }}>
          {notif.title}
        </p>
        <p style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          margin: '0 0 4px',
          lineHeight: 1.4,
        }}>
          {notif.message}
        </p>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {relativeTime(notif.createdAt)}
        </span>
      </div>
    </div>
  )
}
