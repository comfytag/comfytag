'use client'

import { useQuery } from '@tanstack/react-query'
import adminApi from '@/lib/adminApi'
import { adminAnalyticsKeys } from './queryKeys'

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface AdminOverviewStats {
  totalUsers: number
  totalEvents: number
  pendingKyc: number
  pendingPayouts: number
}

export interface AdminUserAnalytics {
  totalUsers: number
  newUsersLast30Days: number
  totalPartners: number
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Binds to GET /api/admin/analytics/overview.
 * Returns { totalUsers, totalEvents, pendingKyc, pendingPayouts }.
 */
export function useAdminOverviewStats() {
  return useQuery({
    queryKey: adminAnalyticsKeys.overview(),
    queryFn: async () => {
      const res = await adminApi.get<{ success: boolean; data: AdminOverviewStats }>(
        '/analytics/overview',
      )
      return res.data.data
    },
    staleTime: 60_000,
  })
}

/**
 * Binds to GET /api/admin/analytics/users.
 * Returns { totalUsers, newUsersLast30Days, totalPartners }.
 */
export function useAdminUserAnalytics() {
  return useQuery({
    queryKey: adminAnalyticsKeys.users(),
    queryFn: async () => {
      const res = await adminApi.get<{ success: boolean; data: AdminUserAnalytics }>(
        '/analytics/users',
      )
      return res.data.data
    },
    staleTime: 60_000,
  })
}

/**
 * Binds to GET /api/admin/analytics/revenue.
 * Returns null because the endpoint is a 501 stub pending Paystack ledger
 * integration. Pages consuming this hook check data === null to render the
 * "implementation pending" state instead of an error banner.
 */
export function useAdminRevenueCharts() {
  return useQuery({
    queryKey: adminAnalyticsKeys.revenue(),
    queryFn: async (): Promise<null> => {
      try {
        await adminApi.get('/analytics/revenue')
      } catch {
        // 501 expected — revenue endpoint requires Paystack transaction ledger
      }
      return null
    },
    staleTime: 300_000,
    retry: false,
  })
}
