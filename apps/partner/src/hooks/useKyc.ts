'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { kycKeys } from './queryKeys'

interface KycStatusResponse {
  success: boolean
  data: {
    isVerify: {
      email: boolean
    }
    verify: {
      photo?: string
      idType?: 'nin' | 'passport' | 'voters_card'
      idDocument?: string
    }
    kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected'
    kycRejectionReason?: string
  }
}

export function useKycStatus() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const token = session?.user?.token

  return useQuery({
    queryKey: kycKeys.status,
    queryFn: async () => {
      if (!userId) throw new Error('No user ID')

      try {
        const response = await api.get<KycStatusResponse>(`/partner/kyc/${userId}`)
        return response.data.data
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
