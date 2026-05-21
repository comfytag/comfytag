'use client'

import React from 'react'
import { Button } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import type { Notification } from '@comfytag/types'

function notifTypeInfo(type: string): { label: string; bg: string; color: string } {
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  if (type.endsWith('_confirmed') || type.endsWith('_approved') || type.endsWith('_accepted')) {
    return { label, bg: '#D1FAE5', color: '#065F46' }
  }
  if (type.endsWith('_rejected') || type.endsWith('_declined')) {
    return { label, bg: '#FEE2E2', color: '#991B1B' }
  }
  if (type.endsWith('_reminder')) {
    return { label, bg: '#FEF3C7', color: '#92400E' }
  }
  if (type === 'new_event_from_following') {
    return { label, bg: '#F5F3FF', color: '#5B21B6' }
  }
  return { label, bg: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }
}

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
  const { label, bg, color } = notifTypeInfo(notif.type)

  function getNavPath(): string | null {
    if (notif.type === 'new_event_from_following' && notif.relatedEventId) {
      return `/events/${notif.relatedEventId}`
    }
    if (notif.type?.includes('order_') && notif.relatedTicketId) {
      return `/events/${notif.relatedEventId}`
    }
    return null
  }

  const navPath = getNavPath()
  const isClickable = !notif.read || !!navPath

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: '1px solid var(--color-border)',
        gap: '16px',
        cursor: isClickable ? 'pointer' : 'default',
        backgroundColor: notif.read ? 'transparent' : 'rgba(124, 58, 237, 0.04)',
        transition: 'background-color 150ms',
      }}
      onClick={() => {
        if (navPath) {
          onNavigate(navPath)
        }
        if (!notif.read && !isMarkingRead) {
          onMarkRead(notif._id)
        }
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.08)'
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable && !notif.read) {
          e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.04)'
        } else if (!isClickable) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {!notif.read && (
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'var(--color-brand)',
            flexShrink: 0,
          }}
        />
      )}
      {notif.read && <div style={{ width: 8, flexShrink: 0 }} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: notif.read ? 400 : 600,
            color: notif.read ? 'var(--color-text-muted)' : 'var(--color-text)',
            fontSize: '14px',
          }}
        >
          {notif.title}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            marginTop: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {notif.message.length > 80 ? notif.message.slice(0, 80) + '…' : notif.message}
        </div>
      </div>

      <span
        style={{
          display: 'inline-flex',
          padding: '3px 10px',
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          background: bg,
          color,
          flexShrink: 0,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: '13px',
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {formatDate(notif.createdAt)}
      </span>

      {!notif.read && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onMarkRead(notif._id)
          }}
          loading={isMarkingRead}
          style={{ flexShrink: 0 }}
        >
          Mark read
        </Button>
      )}
    </div>
  )
}
