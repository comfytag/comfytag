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
  return useQuery({
    queryKey: profileKeys.following,
    queryFn: () => api.get('/organizer/following').then(r => r.data.data ?? []),
    staleTime: 60_000,
  })
}

export function useSavedEvents() {
  return useQuery({
    queryKey: profileKeys.saved,
    queryFn: () => api.get<ApiResponse<Event[]>>('/events/saved').then(r => r.data.data ?? []),
    staleTime: 60_000,
  })
}
