import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ticketKeys } from './queryKeys'
import {
  getCachedTickets,
  setCachedTickets,
  isCacheStale,
} from '../lib/ticketCache'
import type { Ticket, ApiResponse } from '@comfytag/types'

// ─── My tickets ────────────────────────────────────────────────────────────────

export function useMyTickets() {
  const { user, isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: ticketKeys.mine,
    queryFn: async () => {
      if (!user) return []
      // Return cache first; still fetch in background via staleTime
      const cached = await getCachedTickets(user._id)
      if (cached && !isCacheStale(cached.cachedAt)) {
        return cached.tickets as Ticket[]
      }
      const res = await get<ApiResponse<Ticket[]>>('/audience/my')
      const tickets = res.data.data ?? []
      await setCachedTickets(user._id, tickets)
      return tickets
    },
    staleTime: 30_000,
    enabled: isLoggedIn && !!user,
  })
}

// ─── Ticket detail ─────────────────────────────────────────────────────────────
// GET /audience/:id (apps/api/controllers/audience.js getAudience) returns the
// bare ticket document — res.status(200).json(ticket) — not an {success, data}
// envelope. Reading r.data.data here silently resolved to undefined always.

export function useTicketDetail(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => get<Ticket>(`/audience/${ticketId}`).then((r) => r.data),
    staleTime: 30_000,
    enabled: !!ticketId,
  })
}

// ─── Ticket by reference (for claiming transfers) ──────────────────────────────
// Same bare-object response as above — GET /audience/ref/:reference
// (getAudienceByReference) also returns the ticket directly, unwrapped.

export function useTicketByRef(reference: string) {
  return useQuery({
    queryKey: ticketKeys.ref(reference),
    queryFn: () => get<Ticket>(`/audience/ref/${reference}`).then((r) => r.data),
    staleTime: 0,
    enabled: !!reference,
  })
}

// ─── Ticket status polling (for check-in status on ticket detail) ──────────────
// GET /tickets/:id/status is a genuine, permanently-open Server-Sent-Events
// stream server-side (apps/api/controllers/commerce.js getTicketStatus) — it
// never closes the response, so a plain axios GET here just hangs until the
// 10s global timeout fires, every single poll. Polling the already-correct
// GET /audience/:id instead — it returns checkedIn/checkedInAt/status on the
// same document useTicketDetail already reads.

export function useTicketStatus(ticketId: string) {
  return useQuery({
    queryKey: [...ticketKeys.detail(ticketId), 'status'],
    queryFn: () => get<Ticket>(`/audience/${ticketId}`).then((r) => r.data),
    refetchInterval: 10_000,
    enabled: !!ticketId,
  })
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useTransferTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ticketId,
      recipientEmail,
    }: {
      ticketId: string
      recipientEmail: string
    }) =>
      post<ApiResponse<{ transferRef: string }>>(
        '/tickets/transfer/initiate',
        { ticketId, recipientEmail }
      ).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.mine })
    },
  })
}

export function useClaimTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reference }: { reference: string }) =>
      post('/tickets/transfer/claim', { reference }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.mine })
    },
  })
}

// ─── Incoming transfers (received, not yet accepted/declined) ─────────────────
// Real shape of GET /tickets/transfer/incoming (apps/api/controllers/transfer.js
// getIncomingTransfers): { count, transfers: Ticket[] } — raw ticket documents,
// no wrapper object, no senderName, and transferToken is deliberately stripped
// server-side. senderName/transferToken must come from wherever the user
// arrived (the transfer_received notification's data payload), not this list.

export function useIncomingTransfers() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: ticketKeys.incoming,
    queryFn: () =>
      get<{ count: number; transfers: Ticket[] }>(
        '/tickets/transfer/incoming'
      ).then((r) => r.data.transfers),
    staleTime: 0,
    enabled: isLoggedIn,
  })
}

export function useAcceptTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ticketId,
      transferToken,
    }: {
      ticketId: string
      transferToken: string
    }) =>
      post<{ message: string; ticketId: string }>(
        '/tickets/transfer/accept',
        { ticketId, transferToken }
      ).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.mine })
      qc.invalidateQueries({ queryKey: ticketKeys.incoming })
    },
  })
}

export function useDeclineTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      ticketId,
      transferToken,
    }: {
      ticketId: string
      transferToken: string
    }) =>
      post<{ message: string; ticketId: string }>(
        '/tickets/transfer/decline',
        { ticketId, transferToken }
      ).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.incoming })
    },
  })
}
