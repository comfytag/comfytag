'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { attendeeKeys } from './queryKeys'
import type { Ticket } from '@comfytag/types'

export function useAttendees(eventId: string) {
  return useQuery({
    queryKey: attendeeKeys.list(eventId),
    queryFn: () =>
      api
        .get<Ticket[]>(`/audience/event/${eventId}`)
        .then((r) => r.data ?? []),
    staleTime: 30_000,
    enabled: !!eventId,
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
