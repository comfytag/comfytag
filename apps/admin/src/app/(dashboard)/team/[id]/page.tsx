'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { ShieldCheck, Users } from 'lucide-react'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import type { User } from '@comfytag/types'
import api from '@/lib/api'
import { StatCard } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { ProfileCard } from '@/components/ui/ProfileCard'
import { DangerZone } from '@/components/ui/DangerZone'

// ─── Fetch / Mutate ────────────────────────────────────
const fetchUser = async (id: string): Promise<User> => {
  // /admin/users/:id (legacy) strips isAdmin from its response, which breaks
  // the Role stat card below — /api/admin/users/:id is the granular RBAC
  // endpoint and returns isAdmin/role untouched.
  const { data } = await api.get<{ data: User }>(`/api/admin/users/${id}`)
  return data.data
}

const removeAdmin = async (id: string, token: string): Promise<void> => {
  // updateUser's field whitelist doesn't include isAdmin (by design — it's a
  // generic profile-edit endpoint), so PUT /admin/users/:id {isAdmin:false}
  // silently no-ops. changeUserRole is the endpoint that actually revokes
  // admin access (isAdmin is derived from role !== 'viewer' server-side).
  await api.patch(
    `/api/admin/users/${id}/role`,
    { role: 'viewer' },
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

export default function TeamMemberDetailPage() {
  const { data: session } = useSession()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const userQuery = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  })

  const removeMutation = useMutation({
    mutationFn: () => removeAdmin(id, session?.user?.token ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  if (userQuery.isLoading) {
    return <LoadingSpinner size="lg" centered />
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <ErrorMessage
        message="Failed to load team member"
        onRetry={() => void userQuery.refetch()}
      />
    )
  }

  const user = userQuery.data

  return (
    <div>
      <PageHeader
        title={user.name}
        action={
          <Link
            href="/team"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Team
          </Link>
        }
      />

      {/* Profile card */}
      <ProfileCard
        name={user.name}
        email={user.email}
        username={user.username}
        joinedAt={user.createdAt}
      />

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard icon={ShieldCheck} value={user.isAdmin ? 'Admin' : 'User'} label="Role" />
        <StatCard icon={Users} value={user.isPartner ? 'Yes' : 'No'} label="Also Organizer" />
      </div>

      {/* Danger zone */}
      <DangerZone
        description="Removing admin access will prevent this user from accessing the admin panel."
        actionLabel="Remove Admin Access"
        onAction={() => removeMutation.mutate()}
        loading={removeMutation.isPending}
      />
      {removeMutation.isSuccess && (
        <div style={{ color: 'var(--color-success)', fontSize: 14, marginTop: 12 }}>
          Admin access removed.
        </div>
      )}
      {removeMutation.isError && (
        <div style={{ color: 'var(--color-error)', fontSize: 14, marginTop: 12 }}>
          Failed to remove admin access.
        </div>
      )}
    </div>
  )
}
