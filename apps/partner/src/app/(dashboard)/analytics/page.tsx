'use client'

import { useState } from 'react'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatNaira } from '@comfytag/utils'
import { usePartnerAnalytics } from '@/hooks'

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

interface TicketTypeBreakdown {
  name: string
  sold: number
  capacity: number
  revenue: number
}

interface PartnerAnalytics {
  totalLifetimeRevenue: number
  totalEvents: number
  totalTicketsSold: number
  followers: number
  averageTicketPrice: number
  monthlyRevenue: { month: string; revenue: number }[]
  topEvents: { eventId: string; eventName: string; revenue: number }[]
  ticketTypes?: TicketTypeBreakdown[]
}

// ─────────────────────────────────────────────────────────────────────────
// MetricCard — hero stat block
// ─────────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  caption?: string
}

function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-4xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <span className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
        {label}
      </span>
      <div className="text-4xl font-black text-zinc-900 tracking-tight">
        {value}
      </div>
      {caption && (
        <p className="text-xs text-zinc-400 mt-2">{caption}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// AnalyticsPage (thin composer)
// ─────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [expandedTicketType, setExpandedTicketType] = useState<string | null>(null)

  const { data: analytics, isLoading, isError, refetch } = usePartnerAnalytics()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <ErrorMessage message="Failed to load analytics." onRetry={() => refetch()} />
      </div>
    )
  }

  const ticketTypes = analytics?.ticketTypes ?? []
  const monthlyRevenue = analytics?.monthlyRevenue ?? []
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1)

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">Your performance at a glance</p>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <MetricCard
          label="Lifetime Revenue"
          value={formatNaira(analytics?.totalLifetimeRevenue ?? 0)}
          caption="All-time earnings"
        />
        <MetricCard
          label="Tickets Sold"
          value={(analytics?.totalTicketsSold ?? 0).toLocaleString('en-NG')}
          caption="Across all events"
        />
        <MetricCard
          label="Avg Order Value"
          value={formatNaira(analytics?.averageTicketPrice ?? 0)}
          caption="Per ticket revenue"
        />
        <MetricCard
          label="Total Events"
          value={(analytics?.totalEvents ?? 0).toLocaleString('en-NG')}
          caption="All-time events created"
        />
        <MetricCard
          label="Followers"
          value={(analytics?.followers ?? 0).toLocaleString('en-NG')}
          caption="Profile followers"
        />
      </div>

      {/* Revenue Over Time — Master Chart Canvas */}
      <div className="w-full bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-6 sm:p-8 overflow-hidden">
        <h2 className="text-lg font-bold text-zinc-900 mb-6">Revenue Over Time</h2>
        {monthlyRevenue.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-zinc-400">
            No revenue data available yet
          </div>
        ) : (
          <div
            className="flex items-end gap-1.5 sm:gap-2 justify-around"
            style={{ height: '220px' }}
          >
            {monthlyRevenue.map((item, idx) => {
              const h = ((item.revenue || 0) / maxRevenue) * 180
              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="w-full rounded-t bg-violet-600 hover:bg-violet-500 transition-colors duration-150 cursor-pointer"
                    style={{ height: `${Math.max(h, 8)}px` }}
                    title={`${new Date(item.month + '-01').toLocaleString('default', { month: 'long' })}: ${formatNaira(item.revenue)}`}
                  />
                  <span className="text-[10px] font-mono text-zinc-400">
                    {new Date(item.month + '-01').toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Ticket Breakdown Ledger */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 mb-4">Ticket Breakdown</h2>
        {ticketTypes.length === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-4xl p-8 text-center text-sm text-zinc-400 shadow-sm">
            No ticket type data available
          </div>
        ) : (
          <div className="bg-white border border-zinc-200/80 rounded-4xl overflow-hidden shadow-sm">
            {ticketTypes.map((ticketType: TicketTypeBreakdown) => {
              const percentageSold =
                ticketType.capacity > 0
                  ? (ticketType.sold / ticketType.capacity) * 100
                  : 0
              const avgPrice =
                ticketType.sold > 0 ? ticketType.revenue / ticketType.sold : 0
              const isExpanded = expandedTicketType === ticketType.name

              return (
                <div key={ticketType.name} className="border-b border-zinc-100 last:border-0">
                  {/* Ledger Row */}
                  <button
                    onClick={() =>
                      setExpandedTicketType(isExpanded ? null : ticketType.name)
                    }
                    className="flex items-center justify-between p-5 w-full text-left hover:bg-zinc-50/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-zinc-900 font-bold text-sm">{ticketType.name}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {ticketType.sold} / {ticketType.capacity} sold ({percentageSold.toFixed(0)}%)
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm text-zinc-600 font-semibold">
                        {formatNaira(ticketType.revenue)}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-zinc-400 transition-transform duration-150 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                            Revenue
                          </span>
                          <span className="text-sm font-bold text-zinc-900">
                            {formatNaira(ticketType.revenue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                            Avg Price
                          </span>
                          <span className="text-sm font-bold text-zinc-900">
                            {formatNaira(avgPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
