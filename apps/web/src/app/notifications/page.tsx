'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { authHeader } from '@comfytag/utils'
import type { Notification } from '@comfytag/types'
import { NotifRow } from '@/components/notifications/NotifRow'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const { data: notifs = [], isLoading } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()

  function handleRead(id: string) {
    markRead(id)
  }

  // Auth guard
  if (status !== 'loading' && !session) {
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>
          <EmptyState
            title="Sign in to see notifications"
            action={{ label: 'Log In', href: '/login' }}
          />
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, color: 'var(--color-text)' }}>
          Notifications
        </h1>

        {isLoading ? (
          <LoadingSpinner centered size="lg" />
        ) : notifs.length === 0 ? (
          <EmptyState title="You're all caught up" subtitle="No notifications yet." />
        ) : (
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
            {notifs.map((n) => (
              <NotifRow
                key={n._id}
                notif={n}
                onRead={handleRead}
                token={session?.user.token ?? ''}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
