'use client'

import { useQuery } from '@tanstack/react-query'
import type { Event } from '@comfytag/types'
import api from '@/lib/api'
import { adminEventKeys } from './queryKeys'

// The legacy /admin/event endpoint returns { success, data: Event[], total, page, hasMore }
// (not a bare array). Extract .data to normalise to Event[].
export function useAllAdminEvents() {
  return useQuery({
    queryKey: adminEventKeys.list(),
    queryFn: () =>
      api
        .get<{ success: boolean; data: Event[] }>('/admin/event')
        .then((r) => r.data.data ?? []),
    staleTime: 120_000,
  })
}
