'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  UserAdminProfile,
  AdminRole,
  AdminPaginatedResponse,
  ApiResponse,
} from '@comfytag/types'
import adminApi from '@/lib/adminApi'
import { adminRbacUserKeys, kycKeys } from './queryKeys'

// ─── Query: Paginated user roster ─────────────────────────────────────────────

interface AdminUserListParams {
  page?: number
  limit?: number
  role?: AdminRole
  isPartner?: boolean
  suspended?: boolean
}

/**
 * Fetches the paginated admin user roster from GET /api/admin/users.
 * Distinct from the legacy useAllUsers hook which hits the old /admin/users route.
 */
export function useAdminUserList(params: AdminUserListParams = {}) {
  return useQuery({
    queryKey: adminRbacUserKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await adminApi.get<AdminPaginatedResponse<UserAdminProfile>>('/users', {
        params,
      })
      return res.data
    },
    staleTime: 60_000,
  })
}

// ─── Query: Single user detail ────────────────────────────────────────────────

/**
 * Fetches the full admin profile for a single user from GET /api/admin/users/:id.
 */
export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: adminRbacUserKeys.detail(id),
    queryFn: async () => {
      const res = await adminApi.get<ApiResponse<UserAdminProfile>>(`/users/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

// ─── Mutation: Suspend user ───────────────────────────────────────────────────

/**
 * Suspends a user account via PATCH /api/admin/users/:id/suspend.
 * Invalidates the user detail and the full user list so the UI reflects
 * the new suspended state without a manual refresh.
 */
export function useSuspendUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminApi.patch(`/users/${id}/suspend`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: adminRbacUserKeys.detail(id) })
      qc.invalidateQueries({ queryKey: adminRbacUserKeys.list() })
    },
  })
}

// ─── Mutation: Restore user ───────────────────────────────────────────────────

/**
 * Restores a suspended user account via PATCH /api/admin/users/:id/restore.
 */
export function useRestoreUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminApi.patch(`/users/${id}/restore`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: adminRbacUserKeys.detail(id) })
      qc.invalidateQueries({ queryKey: adminRbacUserKeys.list() })
    },
  })
}

// ─── Mutation: Change user role ───────────────────────────────────────────────

interface ChangeRolePayload {
  id: string
  role: AdminRole | 'viewer'
}

/**
 * Updates a user's admin role via PATCH /api/admin/users/:id/role.
 * Also invalidates the KYC queue because a role change may affect the user's
 * kyc_reviewer visibility.
 */
export function useChangeUserRole() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, role }: ChangeRolePayload) =>
      adminApi.patch(`/users/${id}/role`, { role }).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: adminRbacUserKeys.detail(id) })
      qc.invalidateQueries({ queryKey: adminRbacUserKeys.list() })
      qc.invalidateQueries({ queryKey: kycKeys.all })
    },
  })
}
