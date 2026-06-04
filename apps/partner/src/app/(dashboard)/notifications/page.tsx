'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, ErrorMessage, LoadingSpinner } from '@comfytag/ui'
import type { Notification } from '@comfytag/types'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'
import api, { authHeader } from '@/lib/api'

interface NotificationsResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  page: number
  hasMore: boolean
}

export default function NotificationsPage() {
  const { data: session } = useSession()

  const { data, isLoading, isError } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', session?.user.id],
    queryFn: () =>
      api
        .get<NotificationsResponse>('/notification', {
          params: { page: 1, limit: 50 },
          ...authHeader(session?.user.token),
        })
        .then((r) => r.data),
    enabled: !!session?.user.id,
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  if (isLoading) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <PageHeader title="Notifications" subtitle="Loading…" />
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
      />

      {isError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorMessage message="Failed to load notifications." />
        </div>
      )}

      {!isError && (
        <NotificationsPanel notifications={notifications} unreadCount={unreadCount} />
      )}
    </div>
  )
}
