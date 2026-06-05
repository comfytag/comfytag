'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { partnerKeys } from './queryKeys'
import type { PartnerRevenue, PartnerAnalytics, User } from '@comfytag/types'

export function usePartnerRevenue() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: partnerKeys.revenue,
    queryFn: () =>
      api
        .get<PartnerRevenue>(`/partner/${userId}/revenue`)
        .then((r) => r.data),
    staleTime: 120_000,
    enabled: !!userId,
  })
}

export function usePartnerAnalytics() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: partnerKeys.analytics,
    queryFn: () =>
      api
        .get<PartnerAnalytics>(`/partner/${userId}/analytics`)
        .then((r) => r.data),
    staleTime: 300_000,
    enabled: !!userId,
  })
}

export function usePartnerProfile() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: partnerKeys.profile,
    queryFn: () => api.get<User>(`/users/${userId}`).then((r) => r.data),
    staleTime: 300_000,
    enabled: !!userId,
  })
}

interface UpdateProfilePayload {
  name?: string
  email?: string
  phone?: string
  avatar?: string
  image?: string
  [key: string]: string | undefined
}

export function useUpdatePartnerProfile() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      api.patch<User>(`/users/${userId}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: partnerKeys.profile })
    },
  })
}
