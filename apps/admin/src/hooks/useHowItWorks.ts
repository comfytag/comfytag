'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { HowItWorksStep } from '@comfytag/types'
import api from '@/lib/api'
import { howItWorksKeys } from './queryKeys'

interface CreateStepPayload {
  stepNumber: number
  title: string
  description: string
  iconType: string
  isComingSoon?: boolean
  isActive?: boolean
  sortOrder?: number
}

type UpdateStepPayload = Partial<CreateStepPayload>

/**
 * Binds to GET /cms/how-it-works.
 * Note: the public endpoint excludes _id via .select('-_id'), so returned items
 * will not have _id. Delete/edit requires a backend admin-specific GET endpoint
 * that omits the -_id restriction.
 */
export function useHowItWorks() {
  return useQuery({
    queryKey: howItWorksKeys.list(),
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: HowItWorksStep[] }>('/cms/how-it-works/all')
      return res.data.data ?? []
    },
    staleTime: 60_000,
  })
}

/** Binds to POST /cms/how-it-works. Invalidates the step list on success. */
export function useCreateHowItWorksStep() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateStepPayload) =>
      api
        .post<{ success: boolean; data: HowItWorksStep }>('/cms/how-it-works', payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: howItWorksKeys.list() })
    },
  })
}

/** Binds to PUT /cms/how-it-works/:id. Invalidates the step list on success. */
export function useUpdateHowItWorksStep() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStepPayload }) =>
      api
        .put<{ success: boolean; data: HowItWorksStep }>(`/cms/how-it-works/${id}`, payload)
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: howItWorksKeys.list() })
    },
  })
}

/** Binds to DELETE /cms/how-it-works/:id. Invalidates the step list on success. */
export function useDeleteHowItWorksStep() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api
        .delete<{ success: boolean; message: string }>(`/cms/how-it-works/${id}`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: howItWorksKeys.list() })
    },
  })
}
