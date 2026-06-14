'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { LegalDocument, LegalSection } from '@comfytag/types'
import api from '@/lib/api'
import { legalKeys } from './queryKeys'

interface UpsertLegalPayload {
  lastUpdated: string
  version?: string
  sections: LegalSection[]
}

export function useLegalDocument(docType: 'terms' | 'privacy') {
  return useQuery({
    queryKey: legalKeys.detail(docType),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: LegalDocument | null }>(
        `/cms/legal/${docType}`,
      )
      return res.data.data
    },
    staleTime: 60_000,
  })
}

export function useUpsertLegalDocument(docType: 'terms' | 'privacy') {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpsertLegalPayload) =>
      api
        .put<{ success: boolean; data: LegalDocument }>(`/cms/legal/${docType}`, payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: legalKeys.detail(docType) })
    },
  })
}
