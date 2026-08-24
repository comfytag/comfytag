'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { WithdrawRequest, AdminPaginatedResponse, ApiResponse } from '@comfytag/types'
import adminApi from '@/lib/adminApi'
import { adminRbacPayoutKeys } from './queryKeys'

// ─── Query: Pending payout queue ──────────────────────────────────────────────

/**
 * Fetches pending withdrawal requests from GET /api/admin/payouts/pending.
 * Finance-role or higher required.
 */
export function useAdminPayoutList() {
  return useQuery({
    queryKey: adminRbacPayoutKeys.list(),
    queryFn: async () => {
      const res = await adminApi.get<AdminPaginatedResponse<WithdrawRequest>>('/payouts/pending')
      return res.data
    },
    staleTime: 60_000,
  })
}

// ─── Query: Single payout detail ──────────────────────────────────────────────

/**
 * Fetches a single withdrawal request from GET /api/admin/payouts/:id.
 */
export function useAdminPayoutDetail(id: string) {
  return useQuery({
    queryKey: adminRbacPayoutKeys.detail(id),
    queryFn: async () => {
      const res = await adminApi.get<ApiResponse<WithdrawRequest>>(`/payouts/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

// ─── Mutation: Process (initiate Paystack transfer) ───────────────────────────

interface ProcessPayoutPayload {
  withdrawId: string
}

/**
 * Initiates a real Paystack transfer via POST /api/admin/payouts/process.
 * This only starts the transfer — status becomes 'processing', not 'sent'.
 * It's confirmed 'sent' asynchronously by the transfer.success webhook.
 * Invalidates the pending list and the specific payout detail on success.
 */
export function useProcessPayout() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ withdrawId }: ProcessPayoutPayload) =>
      adminApi.post('/payouts/process', { withdrawId }).then((r) => r.data),
    onSuccess: (_data, { withdrawId }) => {
      qc.invalidateQueries({ queryKey: adminRbacPayoutKeys.list() })
      qc.invalidateQueries({ queryKey: adminRbacPayoutKeys.detail(withdrawId) })
    },
  })
}

// ─── Mutation: Reject payout ──────────────────────────────────────────────────

interface RejectPayoutPayload {
  withdrawId: string
  reason?: string
}

/**
 * Rejects a withdrawal via POST /api/admin/payouts/reject.
 * Invalidates the pending list and the specific payout detail on success.
 */
export function useRejectPayout() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ withdrawId, reason }: RejectPayoutPayload) =>
      adminApi.post('/payouts/reject', { withdrawId, reason }).then((r) => r.data),
    onSuccess: (_data, { withdrawId }) => {
      qc.invalidateQueries({ queryKey: adminRbacPayoutKeys.list() })
      qc.invalidateQueries({ queryKey: adminRbacPayoutKeys.detail(withdrawId) })
    },
  })
}
