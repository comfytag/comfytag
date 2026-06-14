'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PromoBanner } from '@comfytag/types'
import api from '@/lib/api'
import { promoBannerKeys } from './queryKeys'

interface CreateBannerPayload {
  bannerKey: string
  title: string
  body: string
  isActive?: boolean
  targetPage?: string
  targetAudience?: string
  startsAt?: string
  expiresAt?: string
}

type UpdateBannerPayload = Partial<CreateBannerPayload>

/**
 * Binds to GET /cms/banners.
 * Note: the public endpoint excludes _id via .select('-_id'), so returned items
 * will not have _id. Delete/edit requires a backend admin-specific GET endpoint
 * that omits the -_id restriction.
 */
export function usePromoBanners() {
  return useQuery({
    queryKey: promoBannerKeys.list(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PromoBanner[] }>('/cms/banners/all')
      return res.data.data ?? []
    },
    staleTime: 30_000,
  })
}

/** Binds to POST /cms/banners. Invalidates the banner list on success. */
export function useCreatePromoBanner() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBannerPayload) =>
      api
        .post<{ success: boolean; data: PromoBanner }>('/cms/banners', payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promoBannerKeys.list() })
    },
  })
}

/** Binds to PUT /cms/banners/:id. Invalidates the banner list on success. */
export function useUpdatePromoBanner() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBannerPayload }) =>
      api
        .put<{ success: boolean; data: PromoBanner }>(`/cms/banners/${id}`, payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promoBannerKeys.list() })
    },
  })
}

/** Binds to DELETE /cms/banners/:id. Invalidates the banner list on success. */
export function useDeletePromoBanner() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api
        .delete<{ success: boolean; message: string }>(`/cms/banners/${id}`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: promoBannerKeys.list() })
    },
  })
}
