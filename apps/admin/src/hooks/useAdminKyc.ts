'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  UserAdminProfile,
  KycApprovalPayload,
  KycRejectPayload,
  AdminPaginatedResponse,
  ApiResponse,
} from '@comfytag/types'
import adminApi from '@/lib/adminApi'
import { kycKeys, adminRbacUserKeys } from './queryKeys'

// ─── Query: KYC review queue ──────────────────────────────────────────────────

interface KycQueueParams {
  page?: number
  limit?: number
}

/**
 * Fetches the paginated list of partner accounts with pending KYC documents.
 * Corresponds to GET /api/admin/kyc/queue.
 */
export function useKycQueue(params: KycQueueParams = {}) {
  return useQuery({
    queryKey: kycKeys.queue(),
    queryFn: async () => {
      const res = await adminApi.get<AdminPaginatedResponse<UserAdminProfile>>('/kyc/queue', {
        params,
      })
      return res.data
    },
    staleTime: 30_000,
  })
}

// ─── Query: Single user KYC details ──────────────────────────────────────────

/**
 * Fetches the full KYC profile for a single user including uploaded documents.
 * Corresponds to GET /api/admin/kyc/:userId.
 */
export function useKycDetails(userId: string) {
  return useQuery({
    queryKey: kycKeys.detail(userId),
    queryFn: async () => {
      const res = await adminApi.get<ApiResponse<UserAdminProfile>>(`/kyc/${userId}`)
      return res.data.data
    },
    enabled: !!userId,
  })
}

// ─── Mutation: Approve KYC ────────────────────────────────────────────────────

/**
 * Approves a user's whole KYC submission (ID document + selfie).
 * Corresponds to POST /api/admin/kyc/approve.
 *
 * On success, invalidates the KYC queue list, the specific user's KYC detail
 * cache, and the RBAC user detail cache so the dashboard reflects the change
 * without a manual refresh.
 */
export function useApproveKyc() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: KycApprovalPayload) =>
      adminApi.post('/kyc/approve', payload).then((r) => r.data),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: kycKeys.queue() })
      qc.invalidateQueries({ queryKey: kycKeys.detail(userId) })
      qc.invalidateQueries({ queryKey: adminRbacUserKeys.detail(userId) })
    },
  })
}

// ─── Mutation: Reject KYC ─────────────────────────────────────────────────────

/**
 * Rejects a user's KYC submission with an optional reason.
 * Corresponds to POST /api/admin/kyc/reject.
 *
 * Invalidates the same caches as useApproveKyc so the queue and detail views
 * are updated immediately.
 */
export function useRejectKyc() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: KycRejectPayload) =>
      adminApi.post('/kyc/reject', payload).then((r) => r.data),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: kycKeys.queue() })
      qc.invalidateQueries({ queryKey: kycKeys.detail(userId) })
      qc.invalidateQueries({ queryKey: adminRbacUserKeys.detail(userId) })
    },
  })
}
