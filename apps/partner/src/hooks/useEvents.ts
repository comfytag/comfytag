'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { partnerEventKeys } from './queryKeys'
import type {
  Event,
  EventAnalytics,
  TierStats,
  PromoCode,
  ApiResponse,
} from '@comfytag/types'

export function useMyEvents() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  return useQuery({
    queryKey: partnerEventKeys.list(),
    queryFn: () =>
      api
        .get<Event[]>(`/events/user/${userId}`, {
          params: { limit: 100 },
        })
        .then((r) => r.data ?? []),
    staleTime: 60_000,
    enabled: !!userId,
  })
}

export function useEventById(id: string) {
  return useQuery({
    queryKey: partnerEventKeys.detail(id),
    queryFn: () => api.get<Event>(`/events/${id}`).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!id,
  })
}

export function useEventAnalytics(id: string) {
  return useQuery({
    queryKey: partnerEventKeys.analytics(id),
    queryFn: () =>
      api.get<EventAnalytics>(`/events/${id}/analytics`).then((r) => r.data),
    staleTime: 300_000,
    enabled: !!id,
  })
}

interface TierStatsResponse {
  tiers: TierStats[]
}

export function useEventTierStats(id: string) {
  return useQuery({
    queryKey: partnerEventKeys.tiers(id),
    queryFn: () =>
      api
        .get<TierStatsResponse>(`/events/${id}/tiers/stats`)
        .then((r) => r.data),
    staleTime: 60_000,
    enabled: !!id,
  })
}

interface CheckInStats {
  eventId: string
  totalCapacity: number
  checkedIn: number
  remaining: number
  checkInRate: number
  byTier: Record<string, number>
  byMethod: Record<string, number>
}

export function useEventCheckinStats(id: string) {
  return useQuery({
    queryKey: partnerEventKeys.checkin(id),
    queryFn: () =>
      api.get<CheckInStats>(`/events/${id}/checkin-stats`).then((r) => r.data),
    staleTime: 0,
    refetchInterval: 5000,
    enabled: !!id,
  })
}

export function useEventPromos(id: string) {
  return useQuery({
    queryKey: partnerEventKeys.promos(id),
    queryFn: () =>
      api.get<PromoCode[]>(`/events/${id}/promos`).then((r) => r.data ?? []),
    staleTime: 60_000,
    enabled: !!id,
  })
}

interface CreatePromoPayload {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxUses?: number
  expiresAt?: string
}

export function useCreatePromo() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: CreatePromoPayload }) =>
      api.post<PromoCode>(`/events/${eventId}/promos`, payload).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.promos(eventId) })
    },
  })
}

export function useDeletePromo() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, code }: { eventId: string; code: string }) =>
      api.delete(`/events/${eventId}/promos/${code}`).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.promos(eventId) })
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) =>
      api.delete(`/events/${eventId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.list() })
    },
  })
}

export function useDuplicateEvent() {
  const { data: session } = useSession()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await api.get<Event>(`/events/${eventId}`)
      const original = res.data
      const { _id, createdAt, updatedAt, sold, ...rest } = original as Event & {
        createdAt?: string
        updatedAt?: string
      }
      const payload = {
        ...rest,
        name: `Copy of ${rest.name}`,
        status: 'draft' as const,
        sold: 0,
      }
      return api
        .post<Event>(`/events/${session!.user.id}`, payload)
        .then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.list() })
    },
  })
}
