import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { eventKeys, profileKeys } from './queryKeys'
import type { Event, ApiResponse, PaginatedResponse } from '@comfytag/types'

export function useEventBySlug(slug: string) {
  return useQuery({
    queryKey: eventKeys.detail(slug),
    queryFn: () => api.get<ApiResponse<Event>>(`/events/${slug}`).then(r => r.data.data),
    staleTime: 120_000,
    enabled: !!slug,
  })
}

export function useEventComments(eventId: string) {
  return useQuery({
    queryKey: eventKeys.comments(eventId),
    queryFn: () => api.get(`/events/${eventId}/comments`).then(r => r.data.comments ?? []),
    staleTime: 30_000,
    enabled: !!eventId,
  })
}

export function useOrganizerProfile(slug: string) {
  return useQuery({
    queryKey: profileKeys.organizer(slug),
    queryFn: () => api.get(`/users/${slug}`).then(r => r.data.data ?? r.data),
    staleTime: 300_000,
    enabled: !!slug,
  })
}

export function useRelatedEvents(category: string, excludeSlug: string) {
  return useQuery({
    queryKey: eventKeys.list({ category, excludeSlug }),
    queryFn: () => api.get(`/events?category=${encodeURIComponent(category)}&limit=8`).then(r => {
      const list: Event[] = r.data.data ?? (Array.isArray(r.data) ? r.data : [])
      return list.filter(e => e.slug !== excludeSlug).slice(0, 4)
    }),
    staleTime: 120_000,
    enabled: !!category,
  })
}

export function useLikeStatus(eventId: string) {
  const { data: session, status } = useSession()
  // Token is part of the key: ApiTokenSync attaches the auth header in an
  // effect that runs after mount, so a query keyed only on eventId would
  // fire unauthenticated first and cache a false "not liked" result for
  // staleTime — keying on the token forces a fresh authenticated refetch
  // once it's actually attached.
  return useQuery({
    queryKey: [...eventKeys.likeStatus(eventId), session?.user?.token ?? null],
    queryFn: () => api.get<{ liked: boolean; likeCount: number }>(`/events/${eventId}/like/status`).then(r => r.data),
    staleTime: 30_000,
    enabled: !!eventId && status !== 'loading',
  })
}

export function useLikeEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, slug }: { eventId: string; slug: string }) =>
      api.post<{ liked: boolean; likeCount: number }>(`/events/${eventId}/like`).then(r => r.data),
    onSuccess: (data, { eventId, slug }) => {
      qc.setQueryData(eventKeys.likeStatus(eventId), data)
      qc.invalidateQueries({ queryKey: eventKeys.detail(slug) })
    },
  })
}

export function useFollowStatus(organizerId: string) {
  const { data: session, status } = useSession()
  // See useLikeStatus for why the token is part of the key — avoids caching
  // a false "not following" result fetched before the auth header is attached.
  return useQuery({
    queryKey: ['organizers', 'followStatus', organizerId, session?.user?.token ?? null],
    queryFn: () => api.get<{ following: boolean; followerCount: number }>(`/organizers/${organizerId}/follow/status`).then(r => r.data),
    staleTime: 30_000,
    enabled: !!organizerId && status !== 'loading',
  })
}

export function useFollowOrganizer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ organizerId, slug }: { organizerId: string; slug: string }) =>
      api.post(`/organizers/${organizerId}/follow`).then(r => r.data),
    onSuccess: (data: { following: boolean; followerCount: number }, { organizerId, slug }) => {
      // Immediately patch the cached profile so the button switches without
      // waiting for a full refetch, then fire a background invalidation for
      // eventual consistency (in case other callers hold stale data).
      qc.setQueryData(
        profileKeys.organizer(slug),
        (old: Record<string, unknown> | undefined) =>
          old ? { ...old, isFollowing: data.following, followerCount: data.followerCount } : old
      )
      qc.invalidateQueries({ queryKey: profileKeys.organizer(slug) })
      qc.invalidateQueries({ queryKey: profileKeys.following })
      qc.invalidateQueries({ queryKey: ['organizers', 'followStatus', organizerId] })
    },
  })
}

export function usePostComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, text }: { eventId: string; text: string }) =>
      api.post(`/events/${eventId}/comments`, { text }).then(r => r.data.data),
    onSuccess: (newComment, { eventId }) => {
      qc.invalidateQueries({ queryKey: eventKeys.comments(eventId) })
    },
  })
}

export function useSaveEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId }: { eventId: string }) =>
      api.post(`/events/${eventId}/save`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.saved })
    },
  })
}
