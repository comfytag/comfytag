'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { ShieldCheck, ScanFace, Building2, Shield } from 'lucide-react'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import type { User } from '@comfytag/types'
import api from '@/lib/api'
import { StatCard } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { ProfileCard } from '@/components/ui/ProfileCard'

// ─── Fetch function ────────────────────────────────────
const fetchUser = async (id: string): Promise<User> => {
  const { data } = await api.get<User>(`/admin/users/${id}`)
  return data
}

// ─── Page ──────────────────────────────────────────────
export default function UserDetailPage() {
  const { data: session } = useSession({ required: true })
  const { id } = useParams<{ id: string }>()

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => fetchUser(id),
    enabled: !!session?.user && !!id,
  })

  if (isLoading) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <LoadingSpinner size="md" centered />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <ErrorMessage message="Failed to load user" />
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <PageHeader
        title={user?.name ?? 'User'}
        action={
          <Link
            href="/users"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Users
          </Link>
        }
      />

      {/* Profile card */}
      <ProfileCard
        name={user?.name ?? ''}
        email={user?.email ?? ''}
        phone={user?.phone}
        username={user?.username}
        joinedAt={user?.createdAt}
      />

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 24,
        }}
      >
        <StatCard
          icon={ShieldCheck}
          value={user?.isVerify?.email ? 'Verified' : 'Unverified'}
          label="Email Status"
        />
        <StatCard
          icon={ScanFace}
          value={user?.faceEnrolled ? 'Enrolled' : 'Not enrolled'}
          label="Face Biometric"
        />
        <StatCard
          icon={Building2}
          value={user?.isPartner ? 'Yes' : 'No'}
          label="Organizer Account"
        />
        <StatCard
          icon={Shield}
          value={user?.isAdmin ? 'Yes' : 'No'}
          label="Admin Access"
        />
      </div>
    </div>
  )
}
