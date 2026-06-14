'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { MarqueeItem } from '@comfytag/types'
import api from '@/lib/api'
import { marqueeKeys } from './queryKeys'

interface CreateMarqueePayload {
  text: string
  pulse?: boolean
  dotColor?: 'red' | 'violet'
  isActive?: boolean
  cityTarget?: string
  sortOrder?: number
  startsAt?: string
  expiresAt?: string
}

type UpdateMarqueePayload = Partial<CreateMarqueePayload>

/**
 * Binds to GET /cms/marquee.
 * Returns all active marquee items sorted by sortOrder.
 */
export function useMarquee() {
  return useQuery({
    queryKey: marqueeKeys.list(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: MarqueeItem[] }>('/cms/marquee/all')
      return res.data.data ?? []
    },
    staleTime: 30_000,
  })
}

/**
 * Binds to POST /cms/marquee.
 * Invalidates the marquee list on success.
 */
export function useCreateMarqueeItem() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateMarqueePayload) =>
      api
        .post<{ success: boolean; data: MarqueeItem }>('/cms/marquee', payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marqueeKeys.list() })
    },
  })
}

/**
 * Binds to PUT /cms/marquee/:id.
 * Invalidates the marquee list on success.
 */
export function useUpdateMarqueeItem() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMarqueePayload }) =>
      api
        .put<{ success: boolean; data: MarqueeItem }>(`/cms/marquee/${id}`, payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marqueeKeys.list() })
    },
  })
}

/**
 * Binds to DELETE /cms/marquee/:id.
 * Invalidates the marquee list on success.
 */
export function useDeleteMarqueeItem() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api
        .delete<{ success: boolean; message: string }>(`/cms/marquee/${id}`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: marqueeKeys.list() })
    },
  })
}
