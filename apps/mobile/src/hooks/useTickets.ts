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

export function useTicketDetail(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () =>
      get<ApiResponse<Ticket>>(`/audience/${ticketId}`).then(
        (r) => r.data.data
      ),
    staleTime: 30_000,
    enabled: !!ticketId,
  })
}

// ─── Ticket by reference (for claiming transfers) ──────────────────────────────

export function useTicketByRef(reference: string) {
  return useQuery({
    queryKey: ticketKeys.ref(reference),
    queryFn: () =>
      get<ApiResponse<Ticket>>(`/audience/ref/${reference}`).then(
        (r) => r.data.data
      ),
    staleTime: 0,
    enabled: !!reference,
  })
}

// ─── Ticket status polling (for check-in status on ticket detail) ──────────────

export function useTicketStatus(ticketId: string) {
  return useQuery({
    queryKey: [...ticketKeys.detail(ticketId), 'status'],
    queryFn: () =>
      get<{ status: Ticket['status']; checkedIn?: boolean }>(
        `/tickets/${ticketId}/status`
      ).then((r) => r.data),
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
