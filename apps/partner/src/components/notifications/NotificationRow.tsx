'use client'

import React from 'react'
import { Button } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import type { Notification } from '@comfytag/types'

function notifTypeInfo(type: string): { label: string; bg: string; color: string } {
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  if (type.endsWith('_confirmed') || type.endsWith('_approved') || type.endsWith('_accepted')) {
    return { label, bg: 'var(--color-success-subtle)', color: 'var(--color-success-text)' }
  }
  if (type.endsWith('_rejected') || type.endsWith('_declined')) {
    return { label, bg: 'var(--color-error-subtle)', color: 'var(--color-error-text)' }
  }
  if (type.endsWith('_reminder')) {
    return { label, bg: 'var(--color-warning-subtle)', color: 'var(--color-warning-text)' }
  }
  if (type === 'new_event_from_following') {
    return { label, bg: 'var(--color-brand-subtle)', color: 'var(--color-brand-dark)' }
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
        padding: 'var(--spacing-3) var(--spacing-4)',
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
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {formatDate(notif.createdAt)}
      </span>

      {!notif.read && (
        <span
          style={{ flexShrink: 0, opacity: 0.7, transition: 'opacity 150ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(notif._id)
            }}
            loading={isMarkingRead}
          >
            Mark read
          </Button>
        </span>
      )}
    </div>
  )
}
