'use client'

import { useQuery } from '@tanstack/react-query'
import type { Event } from '@comfytag/types'
import api from '@/lib/api'
import { adminEventKeys } from './queryKeys'

export function useAllAdminEvents() {
  return useQuery({
    queryKey: adminEventKeys.list(),
    queryFn: () => api.get<Event[]>('/admin/event').then((r) => r.data),
    staleTime: 120_000,
  })
}
