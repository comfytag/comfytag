import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, put } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { kycKeys, profileKeys } from './queryKeys'

// ─── KYC status ────────────────────────────────────────────────────────────────
// Real shape of GET /partner/kyc/:userId (apps/api/controllers/partner.js
// getKycStatus) — kycStatus mirrors the User model's enum exactly
// (apps/api/models/User.js): 'unverified' | 'pending' | 'verified' | 'rejected'.
// There is no 'partial' status and no per-document booleans server-side —
// `verify` holds the submitted document URLs/idType instead.

export type KycIdType = 'nin' | 'passport' | 'voters_card'

export interface KycStatus {
  isVerify: { email: boolean }
  verify: {
    photo?: string
    idType?: KycIdType
    idDocument?: string
  }
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected'
  kycRejectionReason?: string | null
}

export function useKycStatus() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: kycKeys.status,
    queryFn: () =>
      get<{ success: boolean; data: KycStatus }>(
        `/partner/kyc/${user!._id}`
      ).then((r) => r.data.data),
    staleTime: 120_000,
    enabled: !!user,
  })
}

// ─── Submit KYC ────────────────────────────────────────────────────────────────
// Real contract of PUT /users/:id/kyc (apps/api/controllers/users.js uploadKYC,
// multer .fields([{name:'selfie'}, {name:'idDocument'}])): both files are
// required in the SAME request, plus an `idType` text field restricted to
// KYC_ID_TYPES. The controller only stores verify.photo/idType/idDocument +
// kycStatus — it has no fields for full name / ID number / address, so this
// intentionally doesn't collect them.

interface UploadKycPayload {
  idType: KycIdType
  selfie: { uri: string; name: string; type: string }
  idDocument: { uri: string; name: string; type: string }
}

interface UploadKycResponse {
  success: boolean
  message: string
  user: {
    _id: string
    name: string
    email: string
    verify: KycStatus['verify']
    kycStatus: KycStatus['kycStatus']
  }
}

export function useUploadKyc() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ idType, selfie, idDocument }: UploadKycPayload) => {
      const formData = new FormData()
      formData.append('idType', idType)
      // React Native's FormData expects this file-descriptor shape, not a Blob.
      formData.append('selfie', selfie as unknown as Blob)
      formData.append('idDocument', idDocument as unknown as Blob)
      return put<UploadKycResponse>(`/users/${user!._id}/kyc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kycKeys.status })
      qc.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}
