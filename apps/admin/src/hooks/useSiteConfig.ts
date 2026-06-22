'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SiteConfig } from '@comfytag/types'
import adminApi from '@/lib/adminApi'
import { siteConfigKeys } from './queryKeys'

type SiteConfigPayload = Partial<
  Pick<
    SiteConfig,
    'supportEmail' | 'heroHeadline' | 'heroSubtitle' | 'statAttendees' | 'statEvents' | 'statCities'
  >
>

/**
 * Binds to GET /api/admin/settings.
 * Returns the SiteConfig singleton (upserted on first read by the backend).
 */
export function useSiteConfig() {
  return useQuery({
    queryKey: siteConfigKeys.detail(),
    queryFn: async () => {
      const res = await adminApi.get<{ success: boolean; data: SiteConfig }>('/settings')
      return res.data.data
    },
    staleTime: 60_000,
  })
}

/**
 * Binds to PUT /api/admin/settings.
 * Accepts a partial SiteConfig payload and invalidates the detail query on success.
 */
export function useUpdateSiteConfig() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: SiteConfigPayload) =>
      adminApi
        .put<{ success: boolean; data: SiteConfig }>('/settings', payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteConfigKeys.detail() })
    },
  })
}
