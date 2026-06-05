import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { notificationKeys } from './queryKeys'
import type { Notification, ApiResponse } from '@comfytag/types'

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => api.get<ApiResponse<Notification[]>>('/notification').then(r => r.data.data ?? []),
    staleTime: 30_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notification/${id}/read`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list })
    },
  })
}
