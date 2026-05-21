'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Calendar, ShieldCheck, ScanFace } from 'lucide-react'
import { LoadingSpinner, ErrorMessage, Badge } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import type { User, Event } from '@comfytag/types'
import api from '@/lib/api'
import { StatCard } from '@comfytag/ui'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { ProfileCard } from '@/components/ui/ProfileCard'

// ─── Fetch functions ───────────────────────────────────
const fetchUser = async (id: string): Promise<User> => {
  const { data } = await api.get<User>(`/admin/users/${id}`)
  return data
}

const fetchEvents = async (): Promise<Event[]> => {
  const { data } = await api.get<Event[]>('/admin/event')
  return data
}

// ─── Event columns ─────────────────────────────────────
const eventColumns: ColumnDef<Event>[] = [
  { key: 'name', header: 'Event Name', render: (row) => row.name },
  { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
  {
    key: 'status',
    header: 'Status',
    render: (row) => {
      const s = row.status ?? 'draft'
      const mapped = s === 'published' ? 'approved' : s === 'cancelled' ? 'rejected' : s
      return <Badge status={mapped} />
    },
  },
  { key: 'sold', header: 'Sold', render: (row) => String(row.sold) },
]

// ─── Page ──────────────────────────────────────────────
export default function OrganizerDetailPage() {
  const { data: session } = useSession({ required: true })
  const params = useParams()
  const id = params?.id as string

  const userQuery = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => fetchUser(id),
    enabled: !!session?.user && !!id,
  })

  const eventsQuery = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: fetchEvents,
    enabled: !!session?.user,
  })

  const isLoading = userQuery.isLoading || eventsQuery.isLoading

  const user = userQuery.data
  const events = eventsQuery.data ?? []
  const orgEvents = events.filter((e) => e.planner_id === id)

  if (isLoading) {
    return <LoadingSpinner size="md" centered />
  }

  if (userQuery.isError || eventsQuery.isError) {
    return (
      <ErrorMessage
        message="Failed to load organizer details"
        onRetry={() => {
          void userQuery.refetch()
          void eventsQuery.refetch()
        }}
      />
    )
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      <PageHeader
        title={user?.name ?? 'Organizer'}
        action={
          <Link
            href="/organizers"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Organizers
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
      <style>{`
        @media (min-width: 768px) {
          .org-stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
      <div
        className="org-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          icon={Calendar}
          value={orgEvents.length}
          label="Total Events"
        />
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
      </div>

      {/* Events section */}
      {orgEvents.length > 0 && (
        <>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--color-text)',
              marginTop: 32,
              marginBottom: 16,
            }}
          >
            Events
          </h2>
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <DataTable<Event> columns={eventColumns} data={orgEvents} />
          </div>
        </>
      )}
    </div>
  )
}
