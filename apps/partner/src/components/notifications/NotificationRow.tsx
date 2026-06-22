'use client'

import React from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Ticket,
  Bell,
  CalendarDays,
  UserCheck,
  ArrowLeftRight,
  ScanFace,
} from 'lucide-react'
import type { Notification } from '@comfytag/types'

// ─── Type metadata ────────────────────────────────────────────────────────────

interface TypeMeta {
  label: string
  Icon: React.ElementType
  iconBg: string
  iconColor: string
  badgeBg: string
  badgeColor: string
}

function getTypeMeta(type: string): TypeMeta {
  const label = type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bKyc\b/, 'KYC')

  if (type.includes('kyc') || type.includes('identity')) {
    const approved = type.includes('approved')
    return {
      label,
      Icon: UserCheck,
      iconBg: approved ? '#052e16' : '#450a0a',
      iconColor: approved ? '#4ade80' : '#f87171',
      badgeBg: approved ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
      badgeColor: approved ? '#4ade80' : '#f87171',
    }
  }
  if (type.includes('approved') || type.includes('confirmed') || type.includes('accepted')) {
    return {
      label,
      Icon: CheckCircle,
      iconBg: '#052e16',
      iconColor: '#4ade80',
      badgeBg: 'rgba(74,222,128,0.12)',
      badgeColor: '#4ade80',
    }
  }
  if (type.includes('rejected') || type.includes('declined')) {
    return {
      label,
      Icon: XCircle,
      iconBg: '#450a0a',
      iconColor: '#f87171',
      badgeBg: 'rgba(248,113,113,0.12)',
      badgeColor: '#f87171',
    }
  }
  if (type.includes('payout') || type.includes('payment') || type.includes('wallet')) {
    return {
      label,
      Icon: Wallet,
      iconBg: '#451a03',
      iconColor: '#fb923c',
      badgeBg: 'rgba(251,146,60,0.12)',
      badgeColor: '#fb923c',
    }
  }
  if (type.includes('ticket') || type.includes('order')) {
    return {
      label,
      Icon: Ticket,
      iconBg: '#2e1065',
      iconColor: '#c084fc',
      badgeBg: 'rgba(192,132,252,0.12)',
      badgeColor: '#c084fc',
    }
  }
  if (type.includes('event')) {
    return {
      label,
      Icon: CalendarDays,
      iconBg: '#1e1b4b',
      iconColor: '#818cf8',
      badgeBg: 'rgba(129,140,248,0.12)',
      badgeColor: '#818cf8',
    }
  }
  if (type.includes('reminder')) {
    return {
      label,
      Icon: Clock,
      iconBg: '#422006',
      iconColor: '#fbbf24',
      badgeBg: 'rgba(251,191,36,0.12)',
      badgeColor: '#fbbf24',
    }
  }
  if (type.includes('transfer')) {
    const declined = type.includes('declined')
    return {
      label,
      Icon: ArrowLeftRight,
      iconBg: declined ? '#450a0a' : '#1e1b4b',
      iconColor: declined ? '#f87171' : '#818cf8',
      badgeBg: declined ? 'rgba(248,113,113,0.12)' : 'rgba(129,140,248,0.12)',
      badgeColor: declined ? '#f87171' : '#818cf8',
    }
  }
  if (type.includes('face')) {
    return {
      label,
      Icon: ScanFace,
      iconBg: '#052e16',
      iconColor: '#4ade80',
      badgeBg: 'rgba(74,222,128,0.12)',
      badgeColor: '#4ade80',
    }
  }
  return {
    label,
    Icon: Bell,
    iconBg: 'var(--color-surface-2)',
    iconColor: 'var(--color-text-muted)',
    badgeBg: 'rgba(168,162,158,0.12)',
    badgeColor: 'var(--color-text-muted)',
  }
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

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: Notification
  onMarkRead: (id: string) => void
  onNavigate: (path: string) => void
  isMarkingRead: boolean
}

export function NotificationRow({
  notification: notif,
  onMarkRead,
  onNavigate,
  isMarkingRead,
}: NotificationRowProps) {
  const meta = getTypeMeta(notif.type)
  const { Icon } = meta

  function getNavPath(): string | null {
    if (notif.type === 'new_event_from_following' && notif.data?.relatedEventId) {
      return `/events/${notif.data.relatedEventId}`
    }
    if (notif.type.includes('order_') && notif.data?.relatedEventId) {
      return `/events/${notif.data.relatedEventId}`
    }
    return null
  }

  const navPath = getNavPath()
  const isClickable = !notif.read || !!navPath

  function handleClick() {
    if (navPath) onNavigate(navPath)
    if (!notif.read && !isMarkingRead) onMarkRead(notif._id)
  }

  return (
    <>
      <style>{`
        .notif-row { transition: background-color 150ms ease; }
        .notif-row:hover { background-color: rgba(124,58,237,0.06) !important; }
        .notif-row:last-child { border-bottom: none !important; }
        .notif-mark-btn {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid var(--color-border);
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 150ms;
          white-space: nowrap;
        }
        .notif-mark-btn:hover {
          border-color: var(--color-brand);
          color: var(--color-brand);
          background: rgba(124,58,237,0.08);
        }
        .notif-badge { display: inline-flex; }
        @media (max-width: 600px) {
          .notif-badge { display: none !important; }
          .notif-row-right { flex-direction: column; align-items: flex-end !important; gap: 6px !important; }
        }
      `}</style>

      <div
        className="notif-row"
        onClick={isClickable ? handleClick : undefined}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          padding: '16px 20px',
          // borderBottom: '1px solid var(--color-border)',
          cursor: isClickable ? 'pointer' : 'default',
          backgroundColor: notif.read ? 'transparent' : 'rgba(124,58,237,0.04)',
          position: 'relative',
        }}
      >
        {/* Unread accent */}
        {!notif.read && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              borderRadius: '0 2px 2px 0',
              backgroundColor: 'var(--color-brand)',
            }}
          />
        )}

        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: meta.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          <Icon size={18} color={meta.iconColor} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            {!notif.read && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-brand)',
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: notif.read ? 500 : 700,
                color: notif.read ? 'var(--color-text-muted)' : 'var(--color-text)',
                lineHeight: 1.3,
              }}
            >
              {notif.title}
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
              marginBottom: 6,
            }}
          >
            {notif.message}
          </p>

          <span
            style={{
              fontSize: 12,
              color: notif.read ? 'var(--color-text-muted)' : 'var(--color-brand)',
              opacity: notif.read ? 0.7 : 1,
              fontWeight: 500,
            }}
          >
            {timeAgo(notif.createdAt)}
          </span>
        </div>

        {/* Right side: badge + mark read */}
        <div
          className="notif-row-right"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            className="notif-badge"
            style={{
              padding: '3px 10px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 600,
              background: meta.badgeBg,
              color: meta.badgeColor,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {meta.label}
          </span>

          {!notif.read && (
            <button
              className="notif-mark-btn"
              onClick={(e) => {
                e.stopPropagation()
                onMarkRead(notif._id)
              }}
              disabled={isMarkingRead}
            >
              {isMarkingRead ? '…' : 'Mark read'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
