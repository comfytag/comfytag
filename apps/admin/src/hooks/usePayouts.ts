'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { WithdrawRequest } from '@comfytag/types'
import api from '@/lib/api'
import { adminPayoutKeys } from './queryKeys'

export function useAllPayouts() {
  return useQuery({
    queryKey: adminPayoutKeys.list(),
    queryFn: () => api.get<WithdrawRequest[]>('/admin/withdraw').then((r) => r.data),
    staleTime: 60_000,
  })
}

export function usePayoutById(id: string) {
  return useQuery({
    queryKey: adminPayoutKeys.detail(id),
    queryFn: () =>
      api.get<WithdrawRequest>(`/admin/withdraw/show/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useApprovePayout() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.put(`/admin/withdraw/edit/${id}`, { status: 'approved' }).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: adminPayoutKeys.list() })
      qc.invalidateQueries({ queryKey: adminPayoutKeys.detail(id) })
    },
  })
}

export function useLegacyRejectPayout() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.put(`/admin/withdraw/edit/${id}`, { status: 'rejected' }).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: adminPayoutKeys.list() })
      qc.invalidateQueries({ queryKey: adminPayoutKeys.detail(id) })
    },
  })
}
