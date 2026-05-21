'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Users, Banknote, Zap } from 'lucide-react'
import { StatCard, DataTable, ColumnDef, PageHeader, Badge, ErrorMessage } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import api, { authHeader } from '../../../lib/api'

const columns: ColumnDef<Event>[] = [
  {
    key: 'name',
    header: 'Event',
    render: (row) => (
      <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{row.name}</span>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    render: (row) => formatDate(String(row.date ?? '')),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => {
      const s = String(row.status ?? '')
      const mapped = s === 'published' ? 'approved' : s === 'cancelled' ? 'rejected' : s
      return <Badge status={mapped} />
    },
  },
  {
    key: 'sold',
    header: 'Sold',
    render: (row) => ((row.sold as number) ?? 0).toLocaleString('en-NG'),
  },
]

interface PartnerRevenue {
  totalRevenue: number
  totalTicketsSold: number
  totalEvents: number
  availableBalance: number
}

export default function OverviewPage() {
  const { data: session } = useSession()

  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ['events-overview', session?.user.id],
    queryFn: () =>
      api
        .get<Event[]>('/events/user/' + session!.user.id, {
          params: { limit: 100 },
          ...authHeader(session?.user.token),
        })
        .then((r) => r.data),
    enabled: !!session?.user.id,
  })

  const { data: revenueData, isLoading: revenueLoading, isError: revenueError } = useQuery({
    queryKey: ['partner-revenue', session?.user.id],
    queryFn: () =>
      api
        .get<PartnerRevenue>('/partner/' + session!.user.id + '/revenue', {
          ...authHeader(session?.user.token),
        })
        .then((r) => r.data),
    enabled: !!session?.user.id,
  })

  const totalEvents = events.length
  const totalSold = revenueData?.totalTicketsSold ?? 0
  const realRevenue = revenueData?.totalRevenue ?? 0
  const publishedCount = events.filter((e) => e.status === 'published').length
  const isLoading = eventsLoading || revenueLoading
  const isError = eventsError || revenueError

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader title="Overview" subtitle="Your performance at a glance" />

      {isError && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorMessage message="Failed to load overview data." />
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <StatCard
          icon={Calendar}
          value={String(totalEvents)}
          label="Total Events"
          isLoading={isLoading}
        />
        <StatCard
          icon={Users}
          value={totalSold.toLocaleString('en-NG')}
          label="Tickets Sold"
          isLoading={isLoading}
        />
        <StatCard
          icon={Banknote}
          value={formatNaira(realRevenue)}
          label="Total Revenue"
          isLoading={isLoading}
        />
        <StatCard
          icon={Zap}
          value={String(publishedCount)}
          label="Active Events"
          isLoading={isLoading}
        />
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Recent Events
          </h2>
        </div>
        <DataTable
          columns={columns}
          data={recentEvents}
          isLoading={isLoading}
          keyField="_id"
          emptyTitle="No events yet"
          emptySubtitle="Create your first event to get started"
        />
      </div>
    </div>
  )
}
