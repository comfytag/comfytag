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
    // GET /users/:id returns the user object directly, not wrapped in { success, data }.
    queryFn: () => get<User>(`/users/${user!._id}`).then((r) => r.data),
    staleTime: 120_000,
    enabled: isLoggedIn && !!user,
  })
}

// ─── User by ID ────────────────────────────────────────────────────────────────

export function useUserById(userId: string) {
  return useQuery({
    queryKey: profileKeys.user(userId),
    queryFn: () => get<User>(`/users/${userId}`).then((r) => r.data),
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
      get<ApiResponse<User[]>>('/organizers/following').then(
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

// Shared generic image upload (apps/api/routes/upload.js) — any authenticated
// user, not partner-gated. Folder is hardcoded server-side to 'comfytag/events'
// regardless of what's actually being uploaded; harmless for a profile photo,
// just a Cloudinary bucket path.
export function useUploadProfilePhoto() {
  return useMutation({
    mutationFn: (file: { uri: string; name: string; type: string }) => {
      const formData = new FormData()
      formData.append('file', file as unknown as Blob)
      return post<{ success: boolean; url: string; publicId: string }>(
        '/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      ).then((r) => r.data)
    },
  })
}

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
    // PUT /users/:id returns the updated user object directly, not { success, data }.
    mutationFn: (payload: UpdateProfilePayload) =>
      put<User>(`/users/${user!._id}`, payload).then((r) => r.data),
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
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    // PUT /auth/register-organizer/:id returns { message, user, token }, not { success, data }.
    // The token reflects the new organizer role — must replace the stored one, not reuse the old one.
    mutationFn: () =>
      put<{ message: string; user: User; token: string }>(
        `/auth/register-organizer/${user!._id}`
      ).then((r) => r.data),
    onSuccess: ({ user: updated, token: newToken }) => {
      setUser(updated, newToken)
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
