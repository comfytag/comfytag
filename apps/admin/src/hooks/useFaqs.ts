'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { FaqItem } from '@comfytag/types'
import api from '@/lib/api'
import { faqKeys } from './queryKeys'

interface CreateFaqPayload {
  question: string
  answer: string
  category?: string
  sortOrder?: number
  isActive?: boolean
}

type UpdateFaqPayload = Partial<CreateFaqPayload>

export function useFaqs() {
  return useQuery({
    queryKey: faqKeys.list(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: FaqItem[] }>('/cms/faqs/all')
      return res.data.data ?? []
    },
    staleTime: 30_000,
  })
}

export function useCreateFaq() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateFaqPayload) =>
      api
        .post<{ success: boolean; data: FaqItem }>('/cms/faqs', payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: faqKeys.list() })
    },
  })
}

export function useUpdateFaq() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFaqPayload }) =>
      api
        .put<{ success: boolean; data: FaqItem }>(`/cms/faqs/${id}`, payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: faqKeys.list() })
    },
  })
}

export function useDeleteFaq() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api
        .delete<{ success: boolean; message: string }>(`/cms/faqs/${id}`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: faqKeys.list() })
    },
  })
}
