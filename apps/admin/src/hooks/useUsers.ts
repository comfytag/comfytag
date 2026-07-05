'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { User, UserAdminProfile } from '@comfytag/types'
import api from '@/lib/api'
import { adminUserKeys } from './queryKeys'

export function useAllUsers() {
  return useQuery({
    queryKey: adminUserKeys.list(),
    queryFn: () => api.get<User[]>('/admin/users').then((r) => r.data),
    staleTime: 60_000,
  })
}

export function useUserById(id: string) {
  return useQuery({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => api.get<UserAdminProfile>(`/admin/users/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

interface UpdateUserPayload {
  [key: string]: unknown
}

export function useUpdateUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      api.put(`/admin/users/${id}`, payload).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.detail(id) })
      qc.invalidateQueries({ queryKey: adminUserKeys.list() })
    },
  })
}

export function useVerifyKyc() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, field }: { id: string; field: string }) =>
      api.put(`/admin/auth/${id}/verifykyc/${field}`, {}).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: adminUserKeys.detail(id) })
    },
  })
}
