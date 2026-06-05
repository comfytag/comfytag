import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { eventKeys, profileKeys } from './queryKeys'
import type { Event, ApiResponse, PaginatedResponse } from '@comfytag/types'

export function useEventBySlug(slug: string) {
  return useQuery({
    queryKey: eventKeys.detail(slug),
    queryFn: () => api.get<ApiResponse<Event>>(`/events/slug/${slug}`).then(r => r.data.data),
    staleTime: 120_000,
    enabled: !!slug,
  })
}

export function useEventComments(eventId: string) {
  return useQuery({
    queryKey: eventKeys.comments(eventId),
    queryFn: () => api.get(`/events/${eventId}/comments`).then(r => r.data.data ?? []),
    staleTime: 30_000,
    enabled: !!eventId,
  })
}

export function useOrganizerProfile(slug: string) {
  return useQuery({
    queryKey: profileKeys.organizer(slug),
    queryFn: () => api.get(`/organizer/${slug}`).then(r => r.data.data),
    staleTime: 300_000,
    enabled: !!slug,
  })
}

export function useRelatedEvents(category: string, excludeSlug: string) {
  return useQuery({
    queryKey: eventKeys.list({ category, excludeSlug }),
    queryFn: () => api.get(`/events?category=${encodeURIComponent(category)}`).then(r => {
      const list: Event[] = r.data.data ?? []
      return list.filter(e => e.slug !== excludeSlug).slice(0, 4)
    }),
    staleTime: 120_000,
    enabled: !!category,
  })
}

export function useLikeEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, slug }: { eventId: string; slug: string }) =>
      api.post(`/events/${eventId}/like`).then(r => r.data),
    onSuccess: (_, { slug }) => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(slug) })
    },
  })
}

export function useFollowOrganizer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ slug }: { slug: string }) =>
      api.post(`/organizer/${slug}/follow`).then(r => r.data),
    onSuccess: (_, { slug }) => {
      qc.invalidateQueries({ queryKey: profileKeys.organizer(slug) })
      qc.invalidateQueries({ queryKey: profileKeys.following })
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
