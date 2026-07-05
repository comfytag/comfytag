import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '../lib/api'
import { attendeeKeys } from './queryKeys'
import type { Ticket, ApiResponse, PaginatedResponse } from '@comfytag/types'

// ─── Attendee list for an event (organizer view) ───────────────────────────────

export function useEventAttendees(eventId: string) {
  return useQuery({
    queryKey: attendeeKeys.list(eventId),
    queryFn: () =>
      get<PaginatedResponse<Ticket>>(
        `/audience/event/${eventId}`
      ).then((r) => r.data.data ?? []),
    staleTime: 30_000,
    enabled: !!eventId,
  })
}

// ─── Manual check-in toggle (tap row in attendee list) ────────────────────────

export function useManualCheckin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId }: { ticketId: string; eventId: string }) =>
      post<ApiResponse<Ticket>>(`/audience/${ticketId}/checkin`).then(
        (r) => r.data.data
      ),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: attendeeKeys.list(eventId) })
    },
  })
}

// ─── QR/barcode check-in (gate console scanner) ───────────────────────────────

export function useCheckinByRef() {
  return useMutation({
    mutationFn: ({
      reference,
      eventId,
    }: {
      reference: string
      eventId: string
    }) =>
      post<ApiResponse<{ success: boolean; ticket?: Ticket; message?: string }>>(
        '/audience/checkin-by-ref',
        { reference, eventId }
      ).then((r) => r.data.data),
  })
}
