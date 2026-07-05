import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, put } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { notificationKeys } from './queryKeys'
import type { Notification, ApiResponse } from '@comfytag/types'

// ─── Notification list ─────────────────────────────────────────────────────────

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}

export function useNotifications() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () =>
      get<ApiResponse<NotificationsResponse>>('/notification').then((r) => {
        const payload = r.data.data
        return {
          notifications: payload?.notifications ?? [],
          unreadCount: payload?.unreadCount ?? 0,
        }
      }),
    staleTime: 30_000,
    enabled: isLoggedIn,
  })
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ notificationId }: { notificationId: string }) =>
      put(`/notification/${notificationId}/read`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list })
    },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      put('/notification/read-all').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list })
    },
  })
}
