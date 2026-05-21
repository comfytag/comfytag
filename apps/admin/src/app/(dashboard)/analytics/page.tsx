'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Users, Calendar, TrendingUp, Banknote, Download } from 'lucide-react'
import { LoadingSpinner, ErrorMessage, Button } from '@comfytag/ui'
import { formatNaira } from '@comfytag/utils'
import type { Event, User, WithdrawRequest } from '@comfytag/types'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { ValueType, NameType, Formatter } from 'recharts/types/component/DefaultTooltipContent'
import api from '@/lib/api'
import { StatCard } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { TopEventRow } from '@/components/analytics/TopEventRow'

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

// ─── Status colors (hex only — recharts cannot read CSS vars) ──
const STATUS_COLORS: Record<string, string> = {
  Published: '#10B981',
  Draft: '#A8A29E',
  Ended: '#7C3AED',
  Cancelled: '#EF4444',
}

// ─── Module-level helpers ──────────────────────────────

function getLast6Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
  }
  return months
}

function deriveRevenue(events: Event[]): number {
  return events.reduce((sum, e) => sum + e.sold * (e.ticketType[0]?.price ?? 0), 0)
}

function monthLabel(ym: string): string {
  return new Date(ym + '-01').toLocaleDateString('en-NG', { month: 'short', year: '2-digit' })
}

function buildMonthlyRevenue(
  events: Event[],
  months: string[],
): { month: string; revenue: number }[] {
  return months.map((ym) => ({
    month: monthLabel(ym),
    revenue: events
      .filter((e) => e.createdAt.slice(0, 7) === ym)
      .reduce((sum, e) => sum + e.sold * (e.ticketType[0]?.price ?? 0), 0),
  }))
}

function buildUsersByMonth(
  users: User[],
  months: string[],
): { month: string; users: number }[] {
  return months.map((ym) => ({
    month: monthLabel(ym),
    users: users.filter((u) => u.createdAt.slice(0, 7) === ym).length,
  }))
}

function buildPayoutsByMonth(
  withdraws: WithdrawRequest[],
  months: string[],
): { month: string; payouts: number }[] {
  return months.map((ym) => ({
    month: monthLabel(ym),
    payouts: withdraws
      .filter((w) => w.createdAt.slice(0, 7) === ym)
      .reduce((sum, w) => sum + w.amount, 0),
  }))
}

function buildEventsByStatus(events: Event[]): { name: string; value: number }[] {
  return [
    { name: 'Published', value: events.filter((e) => e.status === 'published').length },
    { name: 'Draft', value: events.filter((e) => e.status === 'draft').length },
    { name: 'Ended', value: events.filter((e) => e.status === 'ended').length },
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
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `comfytag-analytics-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Shared tooltip style ──────────────────────────────
const tooltipContentStyle = {
  backgroundColor: 'var(--color-surface-2)',
  border: 'none',
  borderRadius: '8px',
  color: 'var(--color-text)',
}

// ─── Shared tick style ────────────────────────────────
const tickStyle = { fill: 'var(--color-text-muted)', fontSize: 12 }

// ─── Card wrapper style ───────────────────────────────
const chartCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '24px',
}

const chartHeadingStyle: React.CSSProperties = {
  color: 'var(--color-text)',
  fontSize: '14px',
  fontWeight: 600,
  marginBottom: '16px',
  marginTop: 0,
}

// ─── Page component ────────────────────────────────────
export default function AnalyticsPage() {
  const { data: session } = useSession()

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
    enabled: !!session?.user?.token,
  })

  const eventsQuery = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: fetchEvents,
    enabled: !!session?.user?.token,
  })

  const withdrawsQuery = useQuery({
    queryKey: ['admin', 'withdraws'],
    queryFn: () => fetchWithdraws(session?.user?.token ?? ''),
    enabled: !!session?.user?.token,
  })

  if (usersQuery.isLoading || eventsQuery.isLoading || withdrawsQuery.isLoading) {
    return <LoadingSpinner size="lg" centered />
  }

  if (usersQuery.isError || eventsQuery.isError || withdrawsQuery.isError) {
    return <ErrorMessage message="Failed to load analytics data" />
  }

  const users = usersQuery.data ?? []
  const events = eventsQuery.data ?? []
  const withdraws = withdrawsQuery.data ?? []

  const months = getLast6Months()
  const monthlyRevenue = buildMonthlyRevenue(events, months)
  const usersByMonth = buildUsersByMonth(users, months)
  const payoutsByMonth = buildPayoutsByMonth(withdraws, months)
  const eventsByStatus = buildEventsByStatus(events)
  const totalPayouts = withdraws.reduce((s, w) => s + w.amount, 0)

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

      {/* StatCards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        <StatCard
          icon={Users}
          value={(users.length).toString()}
          label="Total Users"
          isLoading={usersQuery.isLoading}
        />
        <StatCard
          icon={Calendar}
          value={(events.length).toString()}
          label="Total Events"
          isLoading={eventsQuery.isLoading}
        />
        <StatCard
          icon={TrendingUp}
          value={formatNaira(deriveRevenue(events))}
          label="Platform Revenue"
          isLoading={eventsQuery.isLoading}
        />
        <StatCard
          icon={Banknote}
          value={formatNaira(totalPayouts)}
          label="Total Payouts"
          isLoading={withdrawsQuery.isLoading}
        />
      </div>

      {/* Chart row 1 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Area chart — Monthly Revenue */}
        <div style={chartCardStyle}>
          <h3 style={chartHeadingStyle}>Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={tickStyle} />
              <YAxis tick={tickStyle} tickFormatter={(v: number) => formatNaira(v)} />
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
                stroke="#7C3AED"
                fill="#7C3AED"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — Events by Status */}
        <div style={chartCardStyle}>
          <h3 style={chartHeadingStyle}>Events by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={eventsByStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {eventsByStatus.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#A8A29E'} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart row 2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Bar chart — New Registrations */}
        <div style={chartCardStyle}>
          <h3 style={chartHeadingStyle}>New Registrations</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={usersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                formatter={
                  ((v: ValueType | undefined) =>
                    [Number(v ?? 0), 'New Users']) as Formatter<ValueType, NameType>
                }
              />
              <Bar dataKey="users" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart — Payouts by Month */}
        <div style={chartCardStyle}>
          <h3 style={chartHeadingStyle}>Payouts by Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={payoutsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={tickStyle} />
              <YAxis tick={tickStyle} tickFormatter={(v: number) => formatNaira(v)} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                formatter={
                  ((v: ValueType | undefined) =>
                    [formatNaira(Number(v ?? 0)), 'Payouts']) as Formatter<ValueType, NameType>
                }
              />
              <Bar dataKey="payouts" fill="#D97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Events */}
      <div style={chartCardStyle}>
        <h3 style={chartHeadingStyle}>Top Events by Revenue</h3>
        {events
          .slice()
          .sort(
            (a, b) =>
              b.sold * (b.ticketType[0]?.price ?? 0) - a.sold * (a.ticketType[0]?.price ?? 0),
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
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', padding: '12px 0' }}>
            No events yet.
          </div>
        )}
      </div>
    </div>
  )
}
