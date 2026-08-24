import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { profileKeys, eventKeys } from './queryKeys'
import type { User, Event, ApiResponse } from '@comfytag/types'

export function useProfile() {
  const { data: session } = useSession()
  const id = session?.user?.id
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => api.get(`/users/${id}`).then(r => r.data),
    staleTime: 300_000,
    enabled: !!id,
  })
}

export function useUpdateProfile() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const id = session?.user?.id
  return useMutation({
    mutationFn: (updates: Partial<User>) =>
      api.patch(`/users/${id}`, updates).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}

export function useMyFollowing() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: profileKeys.following,
    queryFn: () => api.get('/organizers/following').then(r => r.data.data ?? []),
    staleTime: 60_000,
    enabled: !!session?.user?.token,
  })
}

export function useSavedEvents() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: profileKeys.saved,
    queryFn: () => api.get<ApiResponse<Event[]>>('/events/saved').then(r => r.data.data ?? []),
    staleTime: 60_000,
    enabled: !!session?.user?.token,
  })
}

// Upgrades the signed-in attendee's existing account to organizer access and
// hands them off to the partner dashboard — the same PUT /auth/register-organizer
// endpoint apps/mobile already uses, and the same /handoff mechanism the
// "Go to Partner Dashboard" button uses for accounts that are already partners.
// This works on the current session's own token, so it never touches the
// separate partner register/login flow (and its existing-account 409 dead end).
export function useBecomePartner() {
  const { data: session } = useSession()
  const id = session?.user?.id
  return useMutation({
    mutationFn: () =>
      api
        .put<{ message: string; user: User; token: string }>(`/auth/register-organizer/${id}`)
        .then(r => r.data),
    onSuccess: ({ token }) => {
      const partnerUrl = process.env.NEXT_PUBLIC_PARTNER_URL ?? 'http://localhost:3001'
      window.location.href = `${partnerUrl}/handoff?t=${token}`
    },
  })
}
