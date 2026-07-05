import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { profileKeys, eventKeys } from './queryKeys'
import type { User, ApiResponse, Event } from '@comfytag/types'

// ─── My profile ────────────────────────────────────────────────────────────────

export function useMyProfile() {
  const { user, isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () =>
      get<ApiResponse<User>>(`/users/${user!._id}`).then((r) => r.data.data),
    staleTime: 120_000,
    enabled: isLoggedIn && !!user,
  })
}

// ─── User by ID ────────────────────────────────────────────────────────────────

export function useUserById(userId: string) {
  return useQuery({
    queryKey: profileKeys.user(userId),
    queryFn: () =>
      get<ApiResponse<User>>(`/users/${userId}`).then((r) => r.data.data),
    staleTime: 300_000,
    enabled: !!userId,
  })
}

// ─── Following ─────────────────────────────────────────────────────────────────

export function useFollowing() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: profileKeys.following,
    queryFn: () =>
      get<ApiResponse<User[]>>('/organizer/following').then(
        (r) => r.data.data ?? []
      ),
    staleTime: 120_000,
    enabled: isLoggedIn,
  })
}

// ─── Saved events (profile-owned query) ───────────────────────────────────────

export function useSavedEventIds() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: profileKeys.saved,
    queryFn: () =>
      get<ApiResponse<Event[]>>('/events/saved').then((r) =>
        (r.data.data ?? []).map((e) => e._id)
      ),
    staleTime: 60_000,
    enabled: isLoggedIn,
  })
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

interface UpdateProfilePayload {
  name?: string
  username?: string
  phone?: string
  image?: string
}

export function useUpdateProfile() {
  const { user, setUser, token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      put<ApiResponse<User>>(`/users/${user!._id}`, payload).then(
        (r) => r.data.data
      ),
    onSuccess: (updated) => {
      if (token) setUser(updated, token)
      qc.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) =>
      post('/auth/change-password', { currentPassword, newPassword }).then(
        (r) => r.data
      ),
  })
}

export function useUpgradeToOrganizer() {
  const { user, setUser, token } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      put<ApiResponse<User>>(`/auth/register-organizer/${user!._id}`).then(
        (r) => r.data.data
      ),
    onSuccess: (updated) => {
      if (token) setUser(updated, token)
      qc.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}

export function useCompleteOnboarding() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      experienceLevel?: string
      teamSize?: string
      eventFrequency?: string
      interests?: string[]
    }) =>
      put(`/users/onboard/${user!._id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.me })
    },
  })
}
