'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, EmptyState } from '@comfytag/ui'
import type { Notification } from '@comfytag/types'
import { NotificationRow } from './NotificationRow'
import api, { authHeader } from '@/lib/api'

interface NotificationsPanelProps {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationsPanel({
  notifications,
  unreadCount,
}: NotificationsPanelProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      api.put('/notifications/read-all', {}, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user.id] })
    },
  })

  const markOneReadMutation = useMutation({
    mutationFn: (notifId: string) =>
      api.put(`/notifications/${notifId}/read`, {}, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user.id] })
    },
  })

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        subtitle="You will be notified about ticket sales, payouts, and important updates here"
      />
    )
  }

  return (
    <>
      {unreadCount > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Button
            variant="ghost"
            size="sm"
            loading={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            Mark all as read
          </Button>
        </div>
      )}

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
    </>
  )
}
