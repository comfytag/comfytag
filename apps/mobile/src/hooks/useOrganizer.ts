import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put, del } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { partnerKeys, partnerEventKeys, payoutKeys } from './queryKeys'
import type {
  Event,
  PartnerRevenue,
  PartnerAnalytics,
  EventAnalytics,
  TierStats,
  CheckInStats,
  PromoCode,
  ApiResponse,
  PaginatedResponse,
} from '@comfytag/types'

// ─── Partner overview ──────────────────────────────────────────────────────────

export function usePartnerRevenue() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: partnerKeys.revenue,
    queryFn: () =>
      get<PartnerRevenue>(
        `/partner/${user!._id}/revenue`
      ).then((r) => r.data),
    staleTime: 60_000,
    enabled: !!user,
  })
}

export function usePartnerAnalytics() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: partnerKeys.analytics,
    queryFn: () =>
      get<PartnerAnalytics>(
        `/partner/${user!._id}/analytics`
      ).then((r) => r.data),
    staleTime: 300_000,
    enabled: !!user,
  })
}

// ─── Organizer events ──────────────────────────────────────────────────────────

export function useMyEvents() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: partnerEventKeys.list(),
    queryFn: () =>
      get<PaginatedResponse<Event>>(
        `/events/user/${user!._id}?limit=100`
      ).then((r) => r.data.data ?? []),
    staleTime: 60_000,
    enabled: !!user,
  })
}

export function useOrganizerEventById(eventId: string) {
  return useQuery({
    queryKey: partnerEventKeys.detail(eventId),
    queryFn: () =>
      get<ApiResponse<Event>>(`/events/${eventId}`).then((r) => r.data.data),
    staleTime: 60_000,
    enabled: !!eventId,
  })
}

export function useEventAnalytics(eventId: string) {
  return useQuery({
    queryKey: partnerEventKeys.analytics(eventId),
    queryFn: () =>
      get<ApiResponse<EventAnalytics>>(
        `/events/${eventId}/analytics`
      ).then((r) => r.data.data),
    staleTime: 300_000,
    enabled: !!eventId,
  })
}

export function useEventTierStats(eventId: string) {
  return useQuery({
    queryKey: partnerEventKeys.tiers(eventId),
    queryFn: () =>
      get<ApiResponse<TierStats[]>>(
        `/events/${eventId}/tiers/stats`
      ).then((r) => r.data.data ?? []),
    staleTime: 60_000,
    enabled: !!eventId,
  })
}

export function useEventCheckinStats(eventId: string) {
  return useQuery({
    queryKey: partnerEventKeys.checkin(eventId),
    queryFn: () =>
      get<ApiResponse<CheckInStats>>(
        `/events/${eventId}/checkin-stats`
      ).then((r) => r.data.data),
    staleTime: 0,
    refetchInterval: 5_000,
    enabled: !!eventId,
  })
}

export function useEventPromos(eventId: string) {
  return useQuery({
    queryKey: partnerEventKeys.promos(eventId),
    queryFn: () =>
      get<ApiResponse<PromoCode[]>>(
        `/events/${eventId}/promos`
      ).then((r) => r.data.data ?? []),
    staleTime: 60_000,
    enabled: !!eventId,
  })
}

// ─── Event mutations ───────────────────────────────────────────────────────────

interface CreateEventPayload {
  name: string
  category: string
  date: string
  startTime: string
  endTime: string
  venue: string
  address: string
  state: string
  description?: string
  headline?: string
  images?: string[]
  coverImage?: string
  ticketType?: Array<{
    name: string
    price: number
    capacity: number
    saleStartDate?: string
    saleEndDate?: string
    description?: string
  }>
  performers?: Array<{ name: string; photo?: string }>
  gateRules?: string[]
}

export function useCreateEvent() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEventPayload) =>
      post<ApiResponse<Event>>(`/events/${user!._id}`, payload).then(
        (r) => r.data.data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.list() })
    },
  })
}

// Uploads to the shared Cloudinary-backed /upload endpoint (folder:
// comfytag/events) and returns the hosted URL to store as the event's cover.
export function useUploadEventImage() {
  return useMutation({
    mutationFn: (file: { uri: string; name: string; type: string }) => {
      const formData = new FormData()
      // React Native's FormData expects this file-descriptor shape, not a Blob.
      formData.append('file', file as unknown as Blob)
      return post<{ success: boolean; url: string; publicId: string }>(
        '/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      ).then((r) => r.data)
    },
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventId,
      ...payload
    }: Partial<CreateEventPayload> & { eventId: string }) =>
      put<ApiResponse<Event>>(`/events/${eventId}`, payload).then(
        (r) => r.data.data
      ),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.detail(eventId) })
      qc.invalidateQueries({ queryKey: partnerEventKeys.list() })
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId }: { eventId: string }) =>
      del(`/events/${eventId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.list() })
    },
  })
}

export function usePublishEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId }: { eventId: string }) =>
      post(`/events/${eventId}/publish`).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.detail(eventId) })
      qc.invalidateQueries({ queryKey: partnerEventKeys.list() })
    },
  })
}

export function useCancelEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId }: { eventId: string }) =>
      post(`/events/${eventId}/cancel`).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.detail(eventId) })
      qc.invalidateQueries({ queryKey: partnerEventKeys.list() })
    },
  })
}

// ─── Promo mutations ───────────────────────────────────────────────────────────

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
    mutationFn: ({
      eventId,
      ...payload
    }: CreatePromoPayload & { eventId: string }) =>
      post<ApiResponse<PromoCode>>(
        `/events/${eventId}/promos`,
        payload
      ).then((r) => r.data.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.promos(eventId) })
    },
  })
}

export function useDeletePromo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, code }: { eventId: string; code: string }) =>
      del(`/events/${eventId}/promos/${code}`).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.promos(eventId) })
    },
  })
}

// ─── Tier mutations ────────────────────────────────────────────────────────────

export function useUpdateTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      eventId,
      tierId,
      ...payload
    }: {
      eventId: string
      tierId: string
      name?: string
      price?: number
      capacity?: number
      saleStartDate?: string
      saleEndDate?: string
    }) =>
      put(`/events/${eventId}/tiers/${tierId}`, payload).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.detail(eventId) })
      qc.invalidateQueries({ queryKey: partnerEventKeys.tiers(eventId) })
    },
  })
}

export function useDeleteTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, tierId }: { eventId: string; tierId: string }) =>
      del(`/events/${eventId}/tiers/${tierId}`).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.detail(eventId) })
      qc.invalidateQueries({ queryKey: partnerEventKeys.tiers(eventId) })
    },
  })
}
