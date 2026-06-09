'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { kycKeys } from './queryKeys'
import type { User } from '@comfytag/types'

export function useKycStatus() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const token = session?.user?.token

  return useQuery({
    queryKey: kycKeys.status,
    queryFn: async () => {
      if (!userId) throw new Error('No user ID')

      try {
        const response = await api.get<User>(`/partner/users/${userId}`)
        return response.data
      } catch (err) {
        console.error('[KYC Status Error]', err)
        throw err
      }
    },
    staleTime: 60_000,
    enabled: !!userId && !!token,
    retry: 2,
    retryDelay: 1000,
  })
}
