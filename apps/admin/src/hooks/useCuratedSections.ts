'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CuratedSection } from '@comfytag/types'
import api from '@/lib/api'
import { curatedSectionKeys } from './queryKeys'

interface UpdateCuratedSectionPayload {
  title?: string
  eyebrow?: string
  isActive?: boolean
  maxItems?: number
}

export function useCuratedSection(key: string) {
  return useQuery({
    queryKey: curatedSectionKeys.detail(key),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: CuratedSection }>(
        `/cms/curated-sections/${key}`,
      )
      return res.data.data
    },
    staleTime: 60_000,
  })
}

/**
 * Binds to PUT /cms/curated-sections/:key.
 * Invalidates the detail query for the given key on success.
 */
export function useUpdateCuratedSection(key: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateCuratedSectionPayload) =>
      api
        .put<{ success: boolean; data: CuratedSection }>(
          `/cms/curated-sections/${key}`,
          payload,
        )
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: curatedSectionKeys.detail(key) })
    },
  })
}
