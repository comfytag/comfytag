'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { attendeeKeys } from './queryKeys'
import type { Ticket } from '@comfytag/types'

interface EventAudienceResponse {
  data: Ticket[]
  page: number
  limit: number
  total: number
  pages: number
}

export function useAttendees(eventId: string) {
  const { data: session } = useSession()
  const token = session?.user?.token

  return useQuery({
    queryKey: attendeeKeys.list(eventId),
    queryFn: () =>
      api
        .get<EventAudienceResponse>(`/audience/event/${eventId}`)
        .then((r) => r.data?.data ?? []),
    staleTime: 30_000,
    enabled: !!eventId && !!token,
  })
}

interface CheckinPayload {
  [key: string]: string | boolean
}

export function useCheckin() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ attendeeId, eventId, payload }: { attendeeId: string; eventId: string; payload: CheckinPayload }) =>
      api.post(`/audience/${attendeeId}/checkin`, payload).then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: attendeeKeys.list(eventId) })
    },
  })
}

export function useExportAttendees() {
  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await api.get(`/audience/events/${eventId}/audience/export`, {
        responseType: 'text',
      })
      return response.data
    },
  })
}
