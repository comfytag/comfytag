import type { Notification, NotificationType } from '@comfytag/types'
import { api } from '@/lib/api'

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
      .put(`/notifications/${notif._id}/read`, null)
      .catch(() => {})
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
      className={[
        'flex items-start gap-3 px-5 py-4 border-b border-zinc-100 last:border-b-0 outline-none',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-600 transition-colors',
        notif.read
          ? 'bg-white cursor-default border-l-4 border-l-transparent'
          : 'bg-violet-50/50 cursor-pointer border-l-4 border-l-violet-600',
      ].join(' ')}
    >
      {/* Icon bubble */}
      <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-sm shrink-0">
        {typeIcon(notif.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-sm leading-snug mb-0.5',
            notif.read ? 'font-normal text-zinc-600' : 'font-bold text-zinc-900',
          ].join(' ')}
        >
          {notif.title}
        </p>
        <p className="text-xs text-zinc-500 leading-snug mb-1">{notif.message}</p>
        <span className="text-[11px] text-zinc-400">{relativeTime(notif.createdAt)}</span>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-violet-600 shrink-0 mt-1.5" aria-hidden="true" />
      )}
    </div>
  )
}
