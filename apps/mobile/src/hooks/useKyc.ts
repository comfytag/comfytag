import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, put } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { kycKeys, profileKeys } from './queryKeys'
import type { ApiResponse } from '@comfytag/types'

// ─── KYC status ────────────────────────────────────────────────────────────────

export interface KycStatus {
  email: boolean
  photo: boolean
  idCard: boolean
  address: boolean
  overallStatus: 'unverified' | 'partial' | 'verified' | 'rejected'
  rejectionReason?: string
}

export function useKycStatus() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: kycKeys.status,
    queryFn: () =>
      get<ApiResponse<KycStatus>>(
        `/partner/kyc/${user!._id}`
      ).then((r) => r.data.data),
    staleTime: 120_000,
    enabled: !!user,
  })
}

// ─── Upload KYC document ───────────────────────────────────────────────────────

export type KycDocType = 'photo' | 'idCard' | 'address'

export function useUploadKyc() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      docType,
      formData,
    }: {
      docType: KycDocType
      formData: FormData
    }) =>
      put<ApiResponse<{ success: boolean }>>(
        `/users/${user!._id}/kyc`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      ).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kycKeys.status })
      qc.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}
