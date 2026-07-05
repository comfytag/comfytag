import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, del } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
  eventKeys,
  profileKeys,
} from './queryKeys'
import type {
  Event,
  ApiResponse,
  PaginatedResponse,
  MarqueeItem,
  Category,
} from '@comfytag/types'

// ─── Event browse ──────────────────────────────────────────────────────────────

interface EventFilters {
  category?: string
  state?: string
  date?: string
  featured?: boolean
  page?: number
  limit?: number
}

export function useEvents(filters: EventFilters = {}) {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.state) params.set('state', filters.state)
  if (filters.date) params.set('date', filters.date)
  if (filters.featured) params.set('featured', 'true')
  if (filters.page) params.set('page', String(filters.page))
  params.set('limit', String(filters.limit ?? 12))

  const query = params.toString()
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () =>
      get<PaginatedResponse<Event>>(`/events${query ? `?${query}` : ''}`).then(
        (r) => r.data
      ),
    staleTime: 300_000,
  })
}

export function useEventBySlug(slug: string) {
  return useQuery({
    queryKey: eventKeys.detail(slug),
    queryFn: () =>
      get<ApiResponse<Event>>(`/events/${slug}`).then((r) => r.data.data),
    staleTime: 120_000,
    enabled: !!slug,
  })
}

export function useRelatedEvents(category: string, excludeSlug: string) {
  return useQuery({
    queryKey: eventKeys.related(category),
    queryFn: () =>
      get<PaginatedResponse<Event>>(
        `/events?category=${encodeURIComponent(category)}&limit=8`
      ).then((r) => {
        const list = r.data.data ?? []
        return list.filter((e) => e.slug !== excludeSlug).slice(0, 4)
      }),
    staleTime: 120_000,
    enabled: !!category,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: eventKeys.categories,
    queryFn: () =>
      get<ApiResponse<Category[]>>('/events/categories').then(
        (r) => r.data.data ?? []
      ),
    staleTime: 600_000,
  })
}

export function useCategoryCounts() {
  return useQuery({
    queryKey: [...eventKeys.categories, 'counts'],
    queryFn: () =>
      get<ApiResponse<Record<string, number>>>(
        '/events/category-counts'
      ).then((r) => r.data.data ?? {}),
    staleTime: 300_000,
  })
}

export function useMarquee() {
  return useQuery({
    queryKey: eventKeys.marquee,
    queryFn: () =>
      get<{ items?: MarqueeItem[] }>('/cms/marquee').then(
        (r) => r.data.items ?? []
      ),
    staleTime: 300_000,
  })
}

// ─── Event comments ────────────────────────────────────────────────────────────

interface Comment {
  _id: string
  user: { _id: string; name: string; image?: string }
  text: string
  pinned?: boolean
  createdAt: string
}

export function useEventComments(eventId: string) {
  return useQuery({
    queryKey: eventKeys.comments(eventId),
    queryFn: () =>
      get<{ comments?: Comment[] }>(`/events/${eventId}/comments`).then(
        (r) => r.data.comments ?? []
      ),
    staleTime: 30_000,
    enabled: !!eventId,
  })
}

// ─── Saved events ──────────────────────────────────────────────────────────────

export function useSavedEvents() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: eventKeys.saved,
    queryFn: () =>
      get<ApiResponse<Event[]>>('/events/saved').then(
        (r) => r.data.data ?? []
      ),
    staleTime: 60_000,
    enabled: isLoggedIn,
  })
}

// ─── Organizer public profile ──────────────────────────────────────────────────

export function useOrganizerPublicProfile(slug: string) {
  return useQuery({
    queryKey: profileKeys.organizer(slug),
    queryFn: () =>
      get<ApiResponse<Event[]>>(`/users/${slug}`).then(
        (r) => r.data.data ?? r.data
      ),
    staleTime: 300_000,
    enabled: !!slug,
  })
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useLikeEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId }: { eventId: string; slug: string }) =>
      post(`/events/${eventId}/like`).then((r) => r.data),
    onSuccess: (_, { slug }) => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(slug) })
    },
  })
}

export function useSaveEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId }: { eventId: string }) =>
      post(`/events/${eventId}/save`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.saved })
      qc.invalidateQueries({ queryKey: profileKeys.saved })
    },
  })
}

export function usePostComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, text }: { eventId: string; text: string }) =>
      post(`/events/${eventId}/comments`, { text }).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: eventKeys.comments(eventId) })
    },
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      commentId,
    }: {
      commentId: string
      eventId: string
    }) => del(`/comments/${commentId}`).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: eventKeys.comments(eventId) })
    },
  })
}

export function useFollowOrganizer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizerId,
    }: {
      organizerId: string
      slug: string
    }) =>
      post<{ following: boolean; followerCount: number }>(
        `/organizers/${organizerId}/follow`
      ).then((r) => r.data),
    onSuccess: (data, { slug }) => {
      qc.setQueryData(
        profileKeys.organizer(slug),
        (old: Record<string, unknown> | undefined) =>
          old
            ? {
                ...old,
                isFollowing: data.following,
                followerCount: data.followerCount,
              }
            : old
      )
      qc.invalidateQueries({ queryKey: profileKeys.organizer(slug) })
      qc.invalidateQueries({ queryKey: profileKeys.following })
    },
  })
}
