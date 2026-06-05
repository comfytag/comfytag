'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { kycKeys } from './queryKeys'
import type { User } from '@comfytag/types'

export function useKycStatus() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: kycKeys.status,
    queryFn: () => api.get<User>(`/partner/users/${userId}`).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!userId,
  })
}
