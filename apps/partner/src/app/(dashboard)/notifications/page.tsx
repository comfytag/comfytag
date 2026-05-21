import { PageHeader, ErrorMessage } from '@comfytag/ui'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'
import type { Notification, PaginatedResponse } from '@comfytag/types'
import { getServerSession } from 'next-auth'
import api, { authHeader } from '@/lib/api'

interface NotificationsPageProps {}

export default async function NotificationsPage({}: NotificationsPageProps) {
  const session = await getServerSession()

  let notifications: Notification[] = []
  let hasError = false

  try {
    const res = await api.get<PaginatedResponse<Notification>>(
      '/notification',
      {
        params: { page: 1, limit: 50 },
        ...authHeader(session?.user?.token as string),
      }
    )
    notifications = res.data?.data ?? []
  } catch {
    hasError = true
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? unreadCount + ' unread' : 'All caught up!'}
      />

      {hasError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorMessage message="Failed to load notifications." />
        </div>
      )}

      {!hasError && (
        <NotificationsPanel notifications={notifications} unreadCount={unreadCount} />
      )}
    </div>
  )
}
