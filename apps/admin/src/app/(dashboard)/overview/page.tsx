'use client'

import type { CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Users, Calendar, TrendingUp, Banknote } from 'lucide-react'
import { Badge, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { Event, User, WithdrawRequest } from '@comfytag/types'
import api from '@/lib/api'
import { StatCard } from '@comfytag/ui'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'

// ─── Query fetch functions ─────────────────────────────
const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>('/admin/users')
  return data
}

const fetchEvents = async (): Promise<Event[]> => {
  const { data } = await api.get<Event[]>('/admin/event')
  return data
}

const fetchWithdraws = async (token: string): Promise<WithdrawRequest[]> => {
  const { data } = await api.get<WithdrawRequest[]>('/admin/withdraw', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

// ─── Revenue derivation ────────────────────────────────
function deriveRevenue(events: Event[]): number {
  return events.reduce((sum, e) => {
    const price = e.ticketType?.[0]?.price ?? 0
    return sum + e.sold * price
  }, 0)
}

// ─── Table columns ─────────────────────────────────────
const columns: ColumnDef<Event>[] = [
  {
    key: 'event',
    header: 'Event',
    render: (e) => (
      <div>
        <div style={{ fontSize: 14, color: 'var(--color-text)' }}>{e.name}</div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 220,
          }}
        >
          {e.address}
        </div>
      </div>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    render: (e) => formatDate(e.date),
  },
  {
    key: 'status',
    header: 'Status',
    render: (e) => <Badge status={e.status} />,
  },
  {
    key: 'sold',
    header: 'Sold',
    render: (e) =>
      `${e.sold} / ${e.ticketType.reduce((s, t) => s + t.capacity, 0)}`,
  },
  {
    key: 'revenue',
    header: 'Revenue',
    render: (e) => (
      <span style={{ color: 'var(--color-gold)' }}>
        {formatNaira(e.sold * (e.ticketType?.[0]?.price ?? 0))}
      </span>
    ),
  },
]

const todayDate = new Intl.DateTimeFormat('en-NG', { dateStyle: 'full' }).format(new Date())

// Wrapper style that cascades --color-text to gold for the stat value text
const goldValueStyle = { '--color-text': 'var(--color-gold)' } as unknown as CSSProperties

export default function OverviewPage() {
  const { data: session, status } = useSession()

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
  })

  const eventsQuery = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: fetchEvents,
  })

  const withdrawsQuery = useQuery({
    queryKey: ['admin', 'withdraws'],
    queryFn: () => fetchWithdraws(session?.user?.token ?? ''),
    enabled: !!session?.user?.token,
  })

  if (usersQuery.isLoading && eventsQuery.isLoading && status === 'loading') {
    return <LoadingSpinner size="lg" centered />
  }

  if (usersQuery.isError || eventsQuery.isError || withdrawsQuery.isError) {
    return (
      <ErrorMessage
        message="Failed to load dashboard data"
        onRetry={() => {
          void usersQuery.refetch()
          void eventsQuery.refetch()
          void withdrawsQuery.refetch()
        }}
      />
    )
  }

  const users = usersQuery.data ?? []
  const events = eventsQuery.data ?? []
  const withdraws = withdrawsQuery.data ?? []

  const platformRevenue = deriveRevenue(events)
  const totalPayouts = withdraws.reduce((sum, w) => sum + w.amount, 0)
  const recentEvents = events.slice(-5).reverse()

  return (
    <div>
      <PageHeader title="Overview" subtitle={todayDate} />

      <style>{`
        @media (min-width: 768px) {
          .ov-stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>

      <div
        className="ov-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          icon={Users}
          label="Total Users"
          value={usersQuery.data ? users.length : '-'}
          isLoading={usersQuery.isLoading}
        />
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={eventsQuery.data ? events.length : '-'}
          isLoading={eventsQuery.isLoading}
        />
        <div style={goldValueStyle}>
          <StatCard
            icon={TrendingUp}
            label="Platform Revenue"
            value={formatNaira(platformRevenue)}
            isLoading={eventsQuery.isLoading}
          />
        </div>
        <div style={goldValueStyle}>
          <StatCard
            icon={Banknote}
            label="Total Payouts"
            value={formatNaira(totalPayouts)}
            isLoading={withdrawsQuery.isLoading}
          />
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div
          style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}
        >
          Recent Events
        </div>
        <DataTable columns={columns} data={recentEvents} isLoading={eventsQuery.isLoading} />
      </div>
    </div>
  )
}
