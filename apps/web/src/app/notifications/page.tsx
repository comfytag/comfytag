'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { NotifRow } from '@/components/notifications/NotifRow'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const { data: notifs = [], isLoading } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()

  function handleRead(id: string) {
    markRead(id)
  }

  function handleMarkAllRead() {
    notifs.filter((n) => !n.read).forEach((n) => markRead(n._id))
  }

  const unreadCount = notifs.filter((n) => !n.read).length

  if (status !== 'loading' && !session) {
    return (
      <>
        <Navbar />
        <div className="w-full min-h-screen bg-zinc-50/30 pt-8 pb-16 flex items-center justify-center">
          <EmptyState
            title="Sign in to see notifications"
            action={{ label: 'Log In', href: '/login' }}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen bg-zinc-50/30 pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">

          {/* Page header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-zinc-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-violet-600 text-white text-xs font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner centered size="lg" />
            </div>
          ) : notifs.length === 0 ? (
            <div className="mt-12 p-12 bg-white border-2 border-dashed border-zinc-200 rounded-2xl text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-3xl select-none">
                🔔
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-1">You're all caught up</h2>
              <p className="text-sm text-zinc-500">No notifications yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden mt-8 flex flex-col">
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

        </div>
      </div>
    </>
  )
}
