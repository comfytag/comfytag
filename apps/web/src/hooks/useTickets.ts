import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ticketKeys } from './queryKeys'
import type { Ticket, ApiResponse } from '@comfytag/types'

export function useMyTickets() {
  return useQuery({
    queryKey: ticketKeys.list(),
    queryFn: () => api.get<ApiResponse<Ticket[]>>('/tickets/my').then(r => r.data.data ?? []),
    staleTime: 30_000,
  })
}

export function useTicketById(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => api.get<ApiResponse<Ticket>>(`/tickets/${id}`).then(r => r.data.data),
    staleTime: 30_000,
    enabled: !!id,
  })
}
