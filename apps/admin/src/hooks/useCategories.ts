'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Category } from '@comfytag/types'
import api from '@/lib/api'
import { categoryKeys } from './queryKeys'

interface CreateCategoryPayload {
  title: string
  icon?: string
  gradient?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
  [key: string]: unknown
}

interface UpdateCategoryPayload {
  title?: string
  icon?: string
  gradient?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
  [key: string]: unknown
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => api.get<Category[]>('/categories').then((r) => r.data),
    staleTime: 300_000,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      api.post('/categories', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.list() })
    },
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      api.put(`/categories/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.list() })
    },
  })
}
