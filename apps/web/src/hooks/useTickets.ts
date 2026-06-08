import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { ticketKeys } from './queryKeys'
import type { Ticket, ApiResponse } from '@comfytag/types'

export function useMyTickets() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ticketKeys.list(),
    queryFn: () => api.get<ApiResponse<Ticket[]>>('/audience/my').then(r => r.data.data ?? []),
    staleTime: 30_000,
    enabled: !!session?.user?.token,
  })
}

export function useTicketById(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => api.get<Ticket>(`/audience/${id}`).then(r => r.data),
    staleTime: 30_000,
    enabled: !!id,
  })
}
