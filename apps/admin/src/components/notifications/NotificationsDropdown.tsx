'use client'

import { useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Ticket,
  CalendarDays,
  UserCheck,
  ArrowLeftRight,
  ScanFace,
  UserPlus,
  FileCheck,
  BadgeDollarSign,
  ChevronRight,
} from 'lucide-react'
import type { Notification } from '@comfytag/types'
import api from '@/lib/api'
import { NotificationContext } from '@/contexts/NotificationContext'

// ─── Type metadata ────────────────────────────────────────────────────────────

interface TypeMeta {
  Icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
}

function getTypeMeta(type: string): TypeMeta {
  const label = type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bKyc\b/, 'KYC')

  // ── Admin types ──────────────────────────────────────────
  if (type === 'kyc_submitted')
    return { Icon: FileCheck, iconBg: '#1e3a5f', iconColor: '#60a5fa', label }
  if (type === 'payout_requested')
    return { Icon: BadgeDollarSign, iconBg: '#451a03', iconColor: '#fb923c', label }
  if (type === 'organizer_registered')
    return { Icon: UserPlus, iconBg: '#1e1b4b', iconColor: '#818cf8', label }

  // ── Shared types ─────────────────────────────────────────
  if (type.includes('kyc') && type.includes('approved'))
    return { Icon: UserCheck, iconBg: '#052e16', iconColor: '#4ade80', label }
  if (type.includes('kyc') && type.includes('rejected'))
    return { Icon: UserCheck, iconBg: '#450a0a', iconColor: '#f87171', label }
  if (type.includes('approved') || type.includes('confirmed') || type.includes('accepted'))
    return { Icon: CheckCircle, iconBg: '#052e16', iconColor: '#4ade80', label }
  if (type.includes('rejected') || type.includes('declined'))
    return { Icon: XCircle, iconBg: '#450a0a', iconColor: '#f87171', label }
  if (type.includes('payout') || type.includes('payment'))
    return { Icon: Wallet, iconBg: '#451a03', iconColor: '#fb923c', label }
  if (type.includes('transfer'))
    return { Icon: ArrowLeftRight, iconBg: '#1e1b4b', iconColor: '#818cf8', label }
  if (type.includes('ticket') || type.includes('order'))
    return { Icon: Ticket, iconBg: '#2e1065', iconColor: '#c084fc', label }
  if (type.includes('event') && !type.includes('reminder'))
    return { Icon: CalendarDays, iconBg: '#1e1b4b', iconColor: '#818cf8', label }
  if (type.includes('reminder'))
    return { Icon: Clock, iconBg: '#422006', iconColor: '#fbbf24', label }
  if (type.includes('face'))
    return { Icon: ScanFace, iconBg: '#052e16', iconColor: '#4ade80', label }

  return { Icon: Bell, iconBg: '#1a1a1a', iconColor: '#a8a29e', label }
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

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
  for (const n of notifications) {
    const g = getGroup(n.createdAt)
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(n)
  }
  const sorted = new Map<string, Notification[]>()
  for (const key of GROUP_ORDER) {
    if (map.has(key)) sorted.set(key, map.get(key)!)
  }
  return sorted
}

// ─── Navigation mapping ───────────────────────────────────────────────────────

function getNavPath(type: string, data: Record<string, unknown>): string | null {
  switch (type) {
    case 'kyc_submitted':
    case 'kyc_approved':
    case 'kyc_rejected':
      return data.userId ? `/kyc/${data.userId}` : '/kyc'
    case 'payout_requested':
    case 'payout_approved':
    case 'payout_rejected':
      return data.withdrawId ? `/payouts/${data.withdrawId}` : '/payouts'
    case 'organizer_registered':
      return data.userId ? `/organizers/${data.userId}` : '/organizers'
    case 'ticket_sold':
      return data.eventId ? `/events/${data.eventId}` : '/events'
    default:
      return null
  }
}

// ─── Single row ───────────────────────────────────────────────────────────────

function NotifRow({
  notif,
  onMarkRead,
  isMarkingRead,
  onClose,
}: {
  notif: Notification
  onMarkRead: (id: string) => void
  isMarkingRead: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const { Icon, iconBg, iconColor } = getTypeMeta(notif.type)
  const navPath = getNavPath(notif.type, (notif.data ?? {}) as Record<string, unknown>)

  function handleClick() {
    if (!notif.read && !isMarkingRead) onMarkRead(notif._id)
    if (navPath) {
      router.push(navPath)
      onClose()
    }
  }

  return (
    <div
      className="admin-notif-row"
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 16px',
        cursor: navPath || !notif.read ? 'pointer' : 'default',
        backgroundColor: notif.read ? 'transparent' : 'rgba(124,58,237,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        transition: 'background-color 150ms',
      }}
    >
      {/* Unread accent bar */}
      {!notif.read && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 3, borderRadius: '0 2px 2px 0',
          backgroundColor: 'var(--color-brand)',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 'var(--radius-lg)',
        backgroundColor: iconBg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 1,
      }}>
        <Icon size={16} color={iconColor} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          {!notif.read && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: 'var(--color-brand)', flexShrink: 0,
              display: 'inline-block',
            }} />
          )}
          <span style={{
            fontSize: 13,
            fontWeight: notif.read ? 500 : 700,
            color: notif.read ? 'var(--color-text-muted)' : 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {notif.title}
          </span>
        </div>

        <p style={{
          margin: '0 0 4px', fontSize: 12,
          color: 'var(--color-text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {notif.message}
        </p>

        <span style={{
          fontSize: 11, fontWeight: 500,
          color: notif.read ? 'var(--color-text-muted)' : 'var(--color-brand)',
          opacity: notif.read ? 0.6 : 1,
        }}>
          {timeAgo(notif.createdAt)}
        </span>
      </div>

      {/* Navigate indicator */}
      {navPath && (
        <ChevronRight
          size={14}
          color="var(--color-text-muted)"
          style={{ flexShrink: 0, marginTop: 10, opacity: 0.5 }}
        />
      )}
    </div>
  )
}

// ─── Main dropdown ────────────────────────────────────────────────────────────

interface NotificationsDropdownProps {
  onClose: () => void
}

export function NotificationsDropdown({ onClose }: NotificationsDropdownProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { setUnreadCount, resetUnreadCount } = useContext(NotificationContext)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', session?.user?.id],
    queryFn: () =>
      api
        .get<{ notifications: Notification[]; unreadCount: number }>('/notification', {
          params: { limit: 30, page: 1 },
        })
        .then((r) => r.data),
    enabled: !!session?.user?.id,
    staleTime: 15_000,
  })

  // Sync badge count from HTTP response (v5 — no onSuccess in useQuery)
  useEffect(() => {
    if (typeof data?.unreadCount === 'number') setUnreadCount(data.unreadCount)
  }, [data?.unreadCount, setUnreadCount])

  const markOneRead = useMutation({
    mutationFn: (id: string) =>
      api.put(`/notifications/${id}/read`, {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications', session?.user?.id] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all', {}).then((r) => r.data),
    onSuccess: () => {
      resetUnreadCount()
      queryClient.invalidateQueries({ queryKey: ['admin-notifications', session?.user?.id] })
    },
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0
  const grouped = groupNotifications(notifications)

  return (
    <>
      <style>{`
        .admin-notif-row:hover { background-color: rgba(124,58,237,0.09) !important; }
        .admin-notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 380px;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-xl);
          z-index: 100;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 520px;
        }
        @media (max-width: 480px) {
          .admin-notif-dropdown {
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 0 0 var(--radius-xl) var(--radius-xl);
            max-height: 70vh;
          }
        }
        .admin-notif-mark-all {
          padding: 5px 14px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--color-border-light);
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all var(--duration-fast);
          white-space: nowrap;
        }
        .admin-notif-mark-all:hover:not(:disabled) {
          border-color: var(--color-brand);
          color: var(--color-brand);
          background: rgba(124,58,237,0.1);
        }
        .admin-notif-mark-all:disabled { opacity: 0.4; cursor: default; }
        .admin-notif-group-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          padding: 8px 16px 6px;
          background: rgba(255,255,255,0.02);
          opacity: 0.7;
        }
      `}</style>

      <div className="admin-notif-dropdown">

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 20, height: 20, padding: '0 5px',
                borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-brand)',
                color: '#fff', fontSize: 11, fontWeight: 700,
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              className="admin-notif-mark-all"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* Body — scrollable */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {isLoading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '40px 16px', gap: 10,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2px solid var(--color-brand)',
                borderTopColor: 'transparent',
                animation: 'admin-notif-spin 0.7s linear infinite',
              }} />
              <style>{`@keyframes admin-notif-spin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading…</span>
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '48px 16px', gap: 12,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bell size={22} color="var(--color-text-muted)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                  All clear
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  New KYC submissions, payouts and registrations will appear here
                </p>
              </div>
            </div>
          )}

          {!isLoading && Array.from(grouped.entries()).map(([group, items]) => (
            <div key={group}>
              <div className="admin-notif-group-label">{group}</div>
              {items.map((notif) => (
                <NotifRow
                  key={notif._id}
                  notif={notif}
                  onMarkRead={(id) => markOneRead.mutate(id)}
                  isMarkingRead={markOneRead.isPending}
                  onClose={onClose}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Showing last {notifications.length} notifications · auto-deleted after 90 days
            </span>
          </div>
        )}
      </div>
    </>
  )
}
