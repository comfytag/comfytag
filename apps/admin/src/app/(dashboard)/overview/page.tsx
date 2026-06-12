'use client'

import type { CSSProperties } from 'react'
import { useState, useEffect } from 'react'
import { Users, Calendar, TrendingUp, Banknote, BarChart3, FileCheck } from 'lucide-react'
import { StatCard, LoadingSpinner, ErrorMessage, PageHeader, DataTable, Badge } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import {
  useAdminOverviewStats,
  useAdminUserAnalytics,
  useAdminEventList,
} from '@/hooks'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveGmv(events: Event[]): number {
  return events.reduce(
    (sum, e) => sum + e.sold * (e.ticketType?.[0]?.price ?? 0),
    0,
  )
}

interface EventStatusCounts {
  published: number
  ended: number
  cancelled: number
  draft: number
}

function buildStatusCounts(events: Event[]): EventStatusCounts {
  return {
    published: events.filter((e) => e.status === 'published').length,
    ended:     events.filter((e) => e.status === 'ended').length,
    cancelled: events.filter((e) => e.status === 'cancelled').length,
    draft:     events.filter((e) => e.status === 'draft').length,
  }
}

// ─── Recent Events table columns ──────────────────────────────────────────────

const eventColumns: ColumnDef<Event>[] = [
  {
    key: 'event',
    header: 'Event',
    render: (e) => (
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{e.name}</div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 200,
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
    render: (e) => (
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{formatDate(e.date)}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (e) => <Badge status={e.status} />,
  },
  {
    key: 'sold',
    header: 'Sold',
    render: (e) => {
      const cap = (e.ticketType ?? []).reduce((s, t) => s + t.capacity, 0)
      return <span style={{ fontSize: 13 }}>{e.sold} / {cap}</span>
    },
  },
  {
    key: 'revenue',
    header: 'Revenue',
    render: (e) => (
      <span style={{ color: 'var(--color-gold)', fontWeight: 600, fontSize: 13 }}>
        {formatNaira(e.sold * (e.ticketType?.[0]?.price ?? 0))}
      </span>
    ),
  },
]

// ─── Progress bar row ─────────────────────────────────────────────────────────

interface ProgressRowProps {
  label: string
  count: number
  total: number
  color: string
}

function ProgressRow({ label, count, total, color }: ProgressRowProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {count.toLocaleString()} <span style={{ fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div
        style={{
          height: 6,
          backgroundColor: 'var(--color-border)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: 3,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}

// ─── Card shell ───────────────────────────────────────────────────────────────

const cardStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: 24,
}

// Routes --color-text → gold for StatCard's value element
const goldValueStyle = { '--color-text': 'var(--color-gold)' } as unknown as CSSProperties

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [todayDate, setTodayDate] = useState('')
  useEffect(() => {
    setTodayDate(
      new Intl.DateTimeFormat('en-NG', { dateStyle: 'full' }).format(new Date()),
    )
  }, [])

  const overviewQuery = useAdminOverviewStats()
  const userQuery     = useAdminUserAnalytics()
  const eventsQuery   = useAdminEventList({ page: 1, limit: 100 })

  if (overviewQuery.isLoading || eventsQuery.isLoading) {
    return <LoadingSpinner size="lg" centered />
  }

  if (overviewQuery.isError) {
    return (
      <ErrorMessage
        message="Failed to load dashboard overview"
        onRetry={() => { void overviewQuery.refetch() }}
      />
    )
  }

  const stats  = overviewQuery.data!
  const events = eventsQuery.data?.data ?? []
  const recent = events.slice(0, 8)
  const gmv    = deriveGmv(events)

  // Event lifecycle counts come from the page-1 sample; total from authoritative API stat
  const statusCounts    = buildStatusCounts(events)
  const sampleTotal     = events.length || 1 // denominator for ratio percentages
  const authTotal       = stats.totalEvents   // displayed in StatCard

  // KYC verification pipeline
  const totalPartners    = userQuery.data?.totalPartners ?? 0
  const pendingKyc       = stats.pendingKyc
  const verifiedPartners = Math.max(0, totalPartners - pendingKyc)
  const partnerBase      = totalPartners || 1

  return (
    <div>
      <PageHeader title="Overview" subtitle={todayDate} />

      <style>{`
        @media (min-width: 640px)  { .ov-kpi  { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 1024px) { .ov-kpi  { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (min-width: 768px)  { .ov-health { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      {/* ── KPI Ribbon ─────────────────────────────────────────────────────── */}
      <div
        className="ov-kpi"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}
      >
        {/* Gross GMV */}
        <div style={goldValueStyle}>
          <StatCard
            icon={TrendingUp}
            label="Gross GMV"
            value={formatNaira(gmv)}
            isLoading={eventsQuery.isLoading}
          />
        </div>

        {/* Total Users */}
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          isLoading={overviewQuery.isLoading}
        />

        {/* Total Events (authoritative count) */}
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={authTotal.toLocaleString()}
          isLoading={overviewQuery.isLoading}
        />

        {/* Pending Payouts queue depth */}
        <div style={goldValueStyle}>
          <StatCard
            icon={Banknote}
            label="Pending Payouts"
            value={stats.pendingPayouts.toLocaleString()}
            isLoading={overviewQuery.isLoading}
          />
        </div>
      </div>

      {/* ── Platform Health ─────────────────────────────────────────────────── */}
      <div
        className="ov-health"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}
      >
        {/* User Verification Status */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <FileCheck size={16} color="#10B981" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
              User Verification Status
            </span>
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              marginTop: 4,
              marginBottom: 20,
            }}
          >
            KYC pipeline health for partner onboarding
          </p>

          <ProgressRow
            label="Verified Partners"
            count={verifiedPartners}
            total={partnerBase}
            color="#10B981"
          />
          <ProgressRow
            label="Pending KYC Review"
            count={pendingKyc}
            total={partnerBase}
            color="#F59E0B"
          />

          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              backgroundColor: 'var(--color-surface-2)',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Total Organizers
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
              {totalPartners.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Event Lifecycle Ratio */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <BarChart3 size={16} color="#7C3AED" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
              Event Lifecycle Ratio
            </span>
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              marginTop: 4,
              marginBottom: 20,
            }}
          >
            Active vs. suspended event portfolio distribution
          </p>

          <ProgressRow
            label="Published (Active)"
            count={statusCounts.published}
            total={sampleTotal}
            color="#7C3AED"
          />
          <ProgressRow
            label="Ended"
            count={statusCounts.ended}
            total={sampleTotal}
            color="#10B981"
          />
          <ProgressRow
            label="Cancelled / Flagged"
            count={statusCounts.cancelled}
            total={sampleTotal}
            color="#EF4444"
          />
          <ProgressRow
            label="Draft"
            count={statusCounts.draft}
            total={sampleTotal}
            color="#A8A29E"
          />
        </div>
      </div>

      {/* ── Recent Events ───────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: 16,
          }}
        >
          Recent Events
        </div>
        <DataTable<Event>
          columns={eventColumns}
          data={recent}
          isLoading={eventsQuery.isLoading}
          keyField="_id"
          emptyTitle="No events yet"
          emptySubtitle="Events will appear here once organisers begin publishing on the platform."
        />
      </div>
    </div>
  )
}
