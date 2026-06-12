'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { teamKeys } from './queryKeys'

export type TeamPermission = 'checkin' | 'analytics' | 'edit' | 'manage_tickets'

export interface CoOrganizerMember {
  _id: string
  event_id: string
  user_id: {
    _id: string
    name: string
    email: string
    logo?: string | null
  } | null
  email: string
  permissions: TeamPermission[]
  status: 'pending' | 'active' | 'removed'
  invitedBy: string
  createdAt: string
  updatedAt: string
}

interface TeamResponse {
  success: boolean
  data: CoOrganizerMember[]
}

interface AddMemberPayload {
  eventId: string
  email: string
  permissions?: TeamPermission[]
}

interface RemoveMemberPayload {
  eventId: string
  userId: string
}

// GET /events/:id/team
export function useEventTeam(eventId: string) {
  return useQuery({
    queryKey: teamKeys.event(eventId),
    queryFn: () =>
      api
        .get<TeamResponse>(`/events/${eventId}/team`)
        .then((r) => r.data.data ?? []),
    staleTime: 60_000,
    enabled: !!eventId,
  })
}

// POST /events/:id/team
export function useAddTeamMember() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, email, permissions }: AddMemberPayload) =>
      api
        .post(`/events/${eventId}/team`, { email, permissions })
        .then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: teamKeys.event(eventId) })
    },
  })
}

// DELETE /events/:id/team/:userId
export function useRemoveTeamMember() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, userId }: RemoveMemberPayload) =>
      api
        .delete(`/events/${eventId}/team/${userId}`)
        .then((r) => r.data),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: teamKeys.event(eventId) })
    },
  })
}
