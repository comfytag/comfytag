'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { ScanFace, Calendar } from 'lucide-react'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import type { User } from '@comfytag/types'
import api from '@/lib/api'
import { StatCard } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { ProfileCard } from '@/components/ui/ProfileCard'

// ─── Fetch / mutation functions ────────────────────────
const fetchUser = async (id: string): Promise<User> => {
  const { data } = await api.get<User>(`/admin/users/${id}`)
  return data
}

const removeFaceEnrollment = async (id: string, token: string): Promise<void> => {
  await api.delete(`/face/remove/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ─── Page ──────────────────────────────────────────────
export default function FaceEnrollmentDetailPage() {
  const { data: session } = useSession({ required: true })
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  })

  const removeMutation = useMutation({
    mutationFn: () => removeFaceEnrollment(id, session?.user?.token ?? ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] }),
  })

  if (isLoading) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <LoadingSpinner size="md" centered />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <ErrorMessage message="Failed to load face enrollment" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Face Enrollment"
        action={
          <Link
            href="/face-logs"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Face Enrollments
          </Link>
        }
      />

      {/* Profile card */}
      <ProfileCard
        name={user.name}
        email={user.email}
      >
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          {user.isPartner ? 'Organizer' : 'Attendee'}
        </div>
      </ProfileCard>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={ScanFace}
          value={user.faceEnrolled ? 'Enrolled' : 'Not Enrolled'}
          label="Face Biometric"
        />
        <StatCard
          icon={Calendar}
          value={user.faceEnrolledAt ? formatDate(user.faceEnrolledAt) : 'N/A'}
          label="Enrolled On"
        />
      </div>

      {/* Remove button — only if enrolled */}
      {user.faceEnrolled && (
        <div>
          <button
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: '1px solid var(--color-error)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              backgroundColor: 'transparent',
              color: 'var(--color-error)',
              opacity: removeMutation.isPending ? 0.6 : 1,
            }}
          >
            {removeMutation.isPending ? 'Removing...' : 'Remove Enrollment'}
          </button>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
            This will require the user to re-enroll their face at their next check-in.
          </div>
        </div>
      )}

      {removeMutation.isSuccess && (
        <div style={{ color: 'var(--color-success)', fontSize: 14, marginTop: 12 }}>
          Face enrollment removed successfully.
        </div>
      )}
      {removeMutation.isError && (
        <div style={{ color: 'var(--color-error)', fontSize: 14, marginTop: 12 }}>
          Failed to remove enrollment.
        </div>
      )}
    </div>
  )
}
