'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EmptyState, LoadingSpinner, Button, ErrorMessage, PageHeader } from '@comfytag/ui'
import type { Notification, PaginatedResponse } from '@comfytag/types'
import { NotificationRow } from '@/components/notifications/NotificationRow'
import api, { authHeader } from '@/lib/api'


export default function NotificationsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications', session?.user.id],
    queryFn: () =>
      api
        .get<PaginatedResponse<Notification>>('/notification', {
          params: { page: 1, limit: 50 },
          ...authHeader(session?.user.token),
        })
        .then((r) => r.data),
    enabled: !!session?.user.id,
  })

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      api.put('/notifications/read-all', {}, authHeader(session?.user.token)).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user.id] })
    },
  })

  const markOneReadMutation = useMutation({
    mutationFn: (notifId: string) =>
      api.put(`/notifications/${notifId}/read`, {}, authHeader(session?.user.token)).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user.id] })
    },
  })

  const notifications: Notification[] = data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? unreadCount + ' unread' : 'All caught up!'}
        action={
          unreadCount > 0 && !isLoading ? (
            <Button
              variant="ghost"
              size="sm"
              loading={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all as read
            </Button>
          ) : null
        }
      />

      {isError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorMessage message="Failed to load notifications." />
        </div>
      )}

      {isLoading && (
        <div
          style={{
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LoadingSpinner centered size="lg" />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <EmptyState
          title="No notifications yet"
          subtitle="You will be notified about ticket sales, payouts, and important updates here"
        />
      )}

      {!isLoading && notifications.length > 0 && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div>
            {notifications.map((notif) => (
              <NotificationRow
                key={notif._id}
                notification={notif}
                onMarkRead={(id) => markOneReadMutation.mutate(id)}
                onNavigate={(path) => router.push(path)}
                isMarkingRead={markOneReadMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
