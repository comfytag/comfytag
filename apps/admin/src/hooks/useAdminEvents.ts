'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Event, AdminPaginatedResponse, ApiResponse } from '@comfytag/types'
import adminApi from '@/lib/adminApi'
import { adminRbacEventKeys } from './queryKeys'

// ─── Query: Paginated event roster ────────────────────────────────────────────

interface AdminEventListParams {
  status?: string
  page?: number
  limit?: number
}

/**
 * Fetches the paginated global event roster from GET /api/admin/events.
 * Optional `status` filter (draft | published | ended | cancelled).
 */
export function useAdminEventList(params: AdminEventListParams = {}) {
  return useQuery({
    queryKey: adminRbacEventKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await adminApi.get<AdminPaginatedResponse<Event>>('/events', { params })
      return res.data
    },
    staleTime: 60_000,
  })
}

// ─── Query: Single event detail ───────────────────────────────────────────────

/**
 * Fetches a single event by ID from GET /api/admin/events/:id.
 */
export function useAdminEventDetail(id: string) {
  return useQuery({
    queryKey: adminRbacEventKeys.detail(id),
    queryFn: async () => {
      const res = await adminApi.get<ApiResponse<Event>>(`/events/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

// ─── Mutation: Suspend event ──────────────────────────────────────────────────

/**
 * Suspends an event via PATCH /api/admin/events/:id/suspend.
 * Backend sets status → 'cancelled'. Invalidates list and detail caches.
 */
export function useSuspendEvent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminApi.patch(`/events/${id}/suspend`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: adminRbacEventKeys.list() })
      qc.invalidateQueries({ queryKey: adminRbacEventKeys.detail(id) })
    },
  })
}

// ─── Mutation: Restore event ──────────────────────────────────────────────────

/**
 * Restores a suspended event via PATCH /api/admin/events/:id/restore.
 * Backend sets status → 'published'. Invalidates list and detail caches.
 */
export function useRestoreEvent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      adminApi.patch(`/events/${id}/restore`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: adminRbacEventKeys.list() })
      qc.invalidateQueries({ queryKey: adminRbacEventKeys.detail(id) })
    },
  })
}
