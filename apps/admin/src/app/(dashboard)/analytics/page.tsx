'use client'

import { Users, Calendar, TrendingUp, Banknote, Download, Clock } from 'lucide-react'
import { LoadingSpinner, ErrorMessage, Button, StatCard, PageHeader } from '@comfytag/ui'
import { formatNaira } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type {
  ValueType,
  NameType,
  Formatter,
} from 'recharts/types/component/DefaultTooltipContent'
import { TopEventRow } from '@/components/analytics/TopEventRow'
import {
  useAdminOverviewStats,
  useAdminUserAnalytics,
  useAdminRevenueCharts,
  useAdminEventList,
} from '@/hooks'

// ─── Chart theme constants (hex only — recharts cannot read CSS vars in SVG) ──

const BRAND   = '#7C3AED'
const SUCCESS = '#10B981'
const GOLD    = '#D97706'
const MUTED   = '#A8A29E'
const ERROR   = '#EF4444'

const STATUS_COLORS: Record<string, string> = {
  Published: SUCCESS,
  Draft:     MUTED,
  Ended:     BRAND,
  Cancelled: ERROR,
}

// ─── Data derivation helpers ──────────────────────────────────────────────────

function getLast6Months(): string[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

function monthLabel(ym: string): string {
  return new Date(ym + '-01').toLocaleDateString('en-NG', {
    month: 'short',
    year: '2-digit',
  })
}

/** Rolling 30-day revenue indexed by event.createdAt (day granularity). */
function buildLast30DaysRevenue(
  events: Event[],
): Array<{ day: string; revenue: number }> {
  const today = new Date()
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    const iso = d.toISOString().slice(0, 10)
    const revenue = events
      .filter((e) => e.createdAt.slice(0, 10) === iso)
      .reduce((sum, e) => sum + e.sold * (e.ticketType[0]?.price ?? 0), 0)
    return {
      day: d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
      revenue,
    }
  })
}

function buildMonthlyRevenue(
  events: Event[],
  months: string[],
): Array<{ month: string; revenue: number }> {
  return months.map((ym) => ({
    month: monthLabel(ym),
    revenue: events
      .filter((e) => e.createdAt.slice(0, 7) === ym)
      .reduce((sum, e) => sum + e.sold * (e.ticketType[0]?.price ?? 0), 0),
  }))
}

function buildEventsByStatus(events: Event[]) {
  return [
    { name: 'Published', value: events.filter((e) => e.status === 'published').length },
    { name: 'Draft',     value: events.filter((e) => e.status === 'draft').length },
    { name: 'Ended',     value: events.filter((e) => e.status === 'ended').length },
    { name: 'Cancelled', value: events.filter((e) => e.status === 'cancelled').length },
  ]
}

function exportCSV(events: Event[]): void {
  const headers = ['Event Name', 'Date', 'Status', 'Tickets Sold', 'Revenue (NGN)']
  const rows = events.map((e) => [
    e.name,
    new Date(e.date).toLocaleDateString('en-NG'),
    e.status,
    String(e.sold),
    String(e.sold * (e.ticketType[0]?.price ?? 0)),
  ])
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `comfytag-analytics-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Shared chart styles ──────────────────────────────────────────────────────

const tooltipContentStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border-light)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--color-text)',
  fontSize: '12px',
}

const tickStyle = { fill: MUTED, fontSize: 12 }

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
}

const headingStyle: React.CSSProperties = {
  color: 'var(--color-text)',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 4px',
}

const subStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '12px',
  margin: '0 0 20px',
}

// ─── Pending revenue placeholder ──────────────────────────────────────────────

function RevenuePendingCard() {
  return (
    <div
      style={{
        ...cardStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        gap: 12,
        border: '1px dashed rgba(124, 58, 237, 0.4)',
        backgroundColor: 'rgba(124, 58, 237, 0.04)',
      }}
    >
      <Clock size={18} color={BRAND} />
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
          Live Revenue API — Pending
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
          Paystack transaction ledger integration required. Chart below shows
          estimated revenue derived from the event portfolio.
        </p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const overviewQuery = useAdminOverviewStats()
  const userQuery     = useAdminUserAnalytics()
  const revenueQuery  = useAdminRevenueCharts()   // 501 stub — returns null
  const eventsQuery   = useAdminEventList({ page: 1, limit: 200 })

  const isLoading =
    overviewQuery.isLoading || userQuery.isLoading || eventsQuery.isLoading

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (overviewQuery.isError || eventsQuery.isError) {
    return <ErrorMessage message="Failed to load analytics data" />
  }

  const stats      = overviewQuery.data!
  const userStats  = userQuery.data
  const events     = eventsQuery.data?.data ?? []
  const months     = getLast6Months()

  // Chart data
  const rollingRevenue   = buildLast30DaysRevenue(events)
  const monthlyRevenue   = buildMonthlyRevenue(events, months)
  const eventsByStatus   = buildEventsByStatus(events)
  const totalGmv         = events.reduce(
    (sum, e) => sum + e.sold * (e.ticketType[0]?.price ?? 0),
    0,
  )

  // User acquisition breakdown from useAdminUserAnalytics
  const organizers  = userStats?.totalPartners ?? 0
  const buyers      = (userStats?.totalUsers ?? 0) - organizers
  const new30d      = userStats?.newUsersLast30Days ?? 0
  const userSplitData = [
    { segment: 'Organizers',   count: organizers, color: BRAND   },
    { segment: 'Ticket Buyers', count: buyers,    color: SUCCESS },
  ]

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Analytics"
        subtitle="Platform performance overview"
        action={
          <Button variant="ghost" onClick={() => exportCSV(events)}>
            <Download size={16} />
            Export CSV
          </Button>
        }
      />

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <style>{`
        @media (min-width: 640px)  { .an-kpi { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 1024px) { .an-kpi { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (min-width: 768px)  { .an-row2 { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      <div
        className="an-kpi"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}
      >
        <StatCard icon={TrendingUp} label="Gross GMV"       value={formatNaira(totalGmv)}                isLoading={eventsQuery.isLoading} />
        <StatCard icon={Users}      label="Total Users"      value={stats.totalUsers.toLocaleString()}     isLoading={overviewQuery.isLoading} />
        <StatCard icon={Calendar}   label="Total Events"     value={stats.totalEvents.toLocaleString()}    isLoading={overviewQuery.isLoading} />
        <StatCard icon={Banknote}   label="Pending Payouts"  value={stats.pendingPayouts.toLocaleString()} isLoading={overviewQuery.isLoading} />
      </div>

      {/* ── Revenue API status notice ────────────────────────────────────────── */}
      {revenueQuery.data === null && <RevenuePendingCard />}

      {/* ── 30-Day Rolling Revenue (LineChart — violet theme) ───────────────── */}
      <div style={cardStyle}>
        <h3 style={headingStyle}>Platform Revenue · Rolling 30-Day Index</h3>
        <p style={subStyle}>
          Revenue attributed by event creation date · Paystack live ledger pending
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rollingRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="day"
              tick={tickStyle}
              interval={4}
              tickLine={false}
            />
            <YAxis
              tick={tickStyle}
              tickFormatter={(v: number) => formatNaira(v)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipContentStyle}
              formatter={
                ((v: ValueType | undefined) =>
                  [formatNaira(Number(v ?? 0)), 'Revenue']) as Formatter<ValueType, NameType>
              }
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={BRAND}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: BRAND, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Side-by-side: User Acquisition | Events by Status ───────────────── */}
      <div
        className="an-row2"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}
      >
        {/* User Acquisition Curves — derived from useAdminUserAnalytics */}
        <div style={cardStyle}>
          <h3 style={headingStyle}>User Acquisition · Organizers vs. Ticket Buyers</h3>
          <p style={subStyle}>
            {new30d.toLocaleString()} new registrations in the last 30 days
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={userSplitData} layout="vertical" barCategoryGap="30%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                horizontal={false}
              />
              <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="segment"
                type="category"
                tick={tickStyle}
                width={110}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                formatter={
                  ((v: ValueType | undefined) =>
                    [Number(v ?? 0).toLocaleString(), 'Users']) as Formatter<ValueType, NameType>
                }
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {userSplitData.map((entry) => (
                  <Cell key={entry.segment} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Events by Status — PieChart */}
        <div style={cardStyle}>
          <h3 style={headingStyle}>Events by Status</h3>
          <p style={subStyle}>Current portfolio distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={eventsByStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
              >
                {eventsByStatus.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? MUTED} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: MUTED }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Side-by-side: Monthly Revenue | Pending KYC + Payouts ──────────── */}
      <div
        className="an-row2"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}
      >
        {/* 6-Month Revenue AreaChart */}
        <div style={cardStyle}>
          <h3 style={headingStyle}>Monthly Revenue · Last 6 Months</h3>
          <p style={subStyle}>Derived from event portfolio sales</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={tickStyle} tickLine={false} />
              <YAxis
                tick={tickStyle}
                tickFormatter={(v: number) => formatNaira(v)}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                formatter={
                  ((v: ValueType | undefined) =>
                    [formatNaira(Number(v ?? 0)), 'Revenue']) as Formatter<ValueType, NameType>
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={BRAND}
                fill={BRAND}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Health — KYC + Payouts stat panel */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ ...headingStyle, margin: 0 }}>Platform Queue Health</h3>
          <p style={{ ...subStyle, margin: 0 }}>Live counts from analytics API</p>

          {[
            {
              label: 'Pending KYC Reviews',
              value: stats.pendingKyc,
              color: '#F59E0B',
              note: 'organiser accounts awaiting verification',
            },
            {
              label: 'Pending Payouts',
              value: stats.pendingPayouts,
              color: GOLD,
              note: 'withdrawal requests in processing queue',
            },
            {
              label: 'New Users (30 days)',
              value: new30d,
              color: BRAND,
              note: 'registrations across all roles',
            },
          ].map(({ label, value, color, note }) => (
            <div
              key={label}
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-lg)',
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  {label}
                </span>
                <span style={{ fontSize: 22, fontWeight: 800, color }}>
                  {value.toLocaleString()}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
                {note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Events by Revenue ────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <h3 style={{ ...headingStyle, marginBottom: 16 }}>Top Events by Revenue</h3>
        {events
          .slice()
          .sort(
            (a, b) =>
              b.sold * (b.ticketType[0]?.price ?? 0) -
              a.sold * (a.ticketType[0]?.price ?? 0),
          )
          .slice(0, 10)
          .map((event, index) => (
            <TopEventRow
              key={event._id}
              rank={index + 1}
              name={event.name}
              date={event.date}
              ticketsSold={event.sold}
              revenue={event.sold * (event.ticketType[0]?.price ?? 0)}
            />
          ))}
        {events.length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', padding: '12px 0' }}>
            No events yet.
          </p>
        )}
      </div>
    </div>
  )
}
