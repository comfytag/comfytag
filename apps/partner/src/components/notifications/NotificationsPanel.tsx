'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@comfytag/ui'
import { Bell } from 'lucide-react'
import type { Notification } from '@comfytag/types'
import { NotificationRow } from './NotificationRow'
import { api } from '@/lib/api'

interface NotificationsPanelProps {
  notifications: Notification[]
  unreadCount: number
}

// ─── Date grouping ────────────────────────────────────────────────────────────

function getGroup(dateStr: string | undefined): string {
  if (!dateStr) return 'Earlier'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'This week'
  return 'Earlier'
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier']

function groupNotifications(notifications: Notification[]): Map<string, Notification[]> {
  const map = new Map<string, Notification[]>()
  for (const notif of notifications) {
    const group = getGroup(notif.createdAt)
    if (!map.has(group)) map.set(group, [])
    map.get(group)!.push(notif)
  }
  // Sort groups by defined order
  const sorted = new Map<string, Notification[]>()
  for (const key of GROUP_ORDER) {
    if (map.has(key)) sorted.set(key, map.get(key)!)
  }
  return sorted
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationsPanel({ notifications, unreadCount }: NotificationsPanelProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all', {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user.id] })
    },
  })

  const markOneReadMutation = useMutation({
    mutationFn: (notifId: string) =>
      api.put(`/notifications/${notifId}/read`, {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user.id] })
    },
  })

  if (notifications.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={28} color="var(--color-text-muted)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 16, color: 'var(--color-text)' }}>
            No notifications yet
          </p>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
            Ticket sales, payouts and important updates will appear here
          </p>
        </div>
      </div>
    )
  }

  const grouped = groupNotifications(notifications)

  return (
    <>
      <style>{`
        .notif-panel-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .notif-mark-all-btn {
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid var(--color-border);
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 150ms;
          white-space: nowrap;
          opacity: 1;
        }
        .notif-mark-all-btn:hover:not(:disabled) {
          border-color: var(--color-brand);
          color: var(--color-brand);
          background: rgba(124,58,237,0.08);
        }
        .notif-mark-all-btn:disabled { opacity: 0.5; cursor: default; }
        .notif-group-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          padding: 10px 20px 8px;
          // border-bottom: 1px solid var(--color-border);
          background: rgba(255,255,255,0.02);
        }
      `}</style>

      {/* Top bar */}
      <div className="notif-panel-topbar">
        {/* {unreadCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: 'var(--color-brand)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {unreadCount}
            </span>
            <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 500 }}>
              unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            All caught up
          </span>
        )} */}

        {unreadCount > 0 && (
          <button
            className="notif-mark-all-btn"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Notification groups */}
      <div
        style={{
          // backgroundColor: 'var(--color-surface)',
          // border: '0.5px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {Array.from(grouped.entries()).map(([group, items]) => (
          <div key={group}>
            <div className="notif-group-label">{group}</div>
            {items.map((notif) => (
              <NotificationRow
                key={notif._id}
                notification={notif}
                onMarkRead={(id) => markOneReadMutation.mutate(id)}
                onNavigate={(path) => router.push(path)}
                isMarkingRead={markOneReadMutation.isPending}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
