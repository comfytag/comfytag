'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PageContent, PageSection } from '@comfytag/types'
import api from '@/lib/api'
import { pageContentKeys } from './queryKeys'

interface UpsertPagePayload {
  title?: string
  sections: PageSection[]
  isPublished: boolean
}

export function usePageContent(key: string) {
  return useQuery({
    queryKey: pageContentKeys.detail(key),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PageContent | null }>(
        `/cms/pages/${key}`,
      )
      return res.data.data
    },
    staleTime: 60_000,
  })
}

export function useUpsertPageContent(key: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpsertPagePayload) =>
      api
        .put<{ success: boolean; data: PageContent }>(`/cms/pages/${key}`, payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pageContentKeys.detail(key) })
    },
  })
}
