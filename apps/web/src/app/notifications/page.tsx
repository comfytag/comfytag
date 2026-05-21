'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { authHeader } from '@comfytag/utils'
import type { Notification } from '@comfytag/types'
import { NotifRow } from '@/components/notifications/NotifRow'
import api from '@/lib/api'

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchNotifs = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!session) return
      if (append) setLoadingMore(true)
      else setIsLoading(true)

      try {
        const r = await api.get(`/notification?page=${pageNum}&limit=50`, authHeader(session.user.token))
        const list: Notification[] = Array.isArray(r.data)
          ? r.data
          : (r.data?.data ?? r.data?.notifications ?? [])
        setNotifs((prev) => (append ? [...prev, ...list] : list))
        setHasMore(list.length === 50)
      } catch {
        // silent
      } finally {
        setIsLoading(false)
        setLoadingMore(false)
      }
    },
    [session],
  )

  useEffect(() => {
    if (session) {
      fetchNotifs(1, false)
    }
  }, [session, fetchNotifs])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    fetchNotifs(next, true)
  }

  function handleRead(id: string) {
    setNotifs((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
    )
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

        {hasMore && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-brand)',
                background: 'none',
                border: '1px solid var(--color-brand)',
                borderRadius: 8,
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                opacity: loadingMore ? 0.6 : 1,
              }}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </main>
    </>
  )
}
