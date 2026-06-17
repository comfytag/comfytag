'use client'

import Link from 'next/link'
import { ChartCard } from '@/components/ui/ChartCard'
import { formatNaira } from '@comfytag/utils'

interface EventAnalytics {
  eventId: string
  eventName: string
  totalRevenue: number
  totalTicketsSold: number
  totalCapacity: number
  checkInCount: number
  checkInRate: number
  dailySales: Array<{ date: string; sold: number; revenue: number }>
  tierStats: Array<{ _id: string; name: string; sold: number; capacity: number; soldPercentage: number; revenue?: number; avgPrice?: number }>
}

interface EventAnalyticsClientProps {
  analytics: EventAnalytics
  eventId: string
}

export function EventAnalyticsClient({ analytics, eventId }: EventAnalyticsClientProps) {
  const maxDailySales = Math.max(...(analytics.dailySales?.map(d => d.revenue) || [1]))
  const chartHeight = 200
  const barWidth = analytics.dailySales?.length ? Math.max(2, Math.min(20, 400 / analytics.dailySales.length)) : 0
  const barGap = Math.max(1, barWidth * 0.2)

  return (
    <>
      {/* Event Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{analytics.eventName}</h1>
        <p className="text-zinc-500 text-sm mt-1">Event performance analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ChartCard title="Total Revenue" subtitle="Event earnings">
          <div className="text-3xl font-black text-amber-600 leading-none">
            {formatNaira(analytics.totalRevenue)}
          </div>
        </ChartCard>

        <ChartCard title="Tickets Sold" subtitle={`/ ${analytics.totalCapacity} capacity`}>
          <div className="text-3xl font-black text-zinc-900 leading-none">
            {analytics.totalTicketsSold}
          </div>
        </ChartCard>

        <ChartCard title="Check-In Rate" subtitle={`${analytics.checkInCount} checked in`}>
          <div className="text-3xl font-black text-violet-600 leading-none">
            {analytics.checkInRate.toFixed(1)}%
          </div>
        </ChartCard>

        <ChartCard title="Checked In" subtitle="Attendees verified">
          <div className="text-3xl font-black text-zinc-900 leading-none">
            {analytics.checkInCount}
          </div>
        </ChartCard>
      </div>

      {/* Daily Sales Chart — Master Chart Canvas */}
      {analytics.dailySales && analytics.dailySales.length > 0 && (
        <div className="w-full bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-6 sm:p-8 overflow-hidden mb-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-6">Daily Sales</h2>
          <div
            className="flex items-end justify-center border-b border-zinc-100 mb-3"
            style={{ gap: `${barGap}px`, height: `${chartHeight}px`, padding: '16px 0' }}
          >
            {analytics.dailySales.map((day, idx) => {
              const barHeight = (day.revenue / maxDailySales) * (chartHeight - 40)
              return (
                <div
                  key={idx}
                  className="flex-1 bg-violet-600 hover:opacity-70 rounded-t cursor-pointer transition-opacity duration-150"
                  style={{ height: `${barHeight}px`, minWidth: `${barWidth}px` }}
                  title={`${new Date(day.date).toLocaleDateString('en-GB')}: ${day.sold} tickets, ${formatNaira(day.revenue)}`}
                />
              )
            })}
          </div>
          <p className="text-xs text-zinc-400 text-center font-mono">
            {analytics.dailySales.length} days of sales data
          </p>
        </div>
      )}

      {/* Tier Performance — Ledger Table */}
      {analytics.tierStats && analytics.tierStats.length > 0 && (
        <div className="bg-white border border-zinc-200/80 rounded-4xl overflow-hidden shadow-sm mb-8">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-900">Ticket Tier Performance</h2>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-5 py-3 text-left text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-5 py-3 text-center text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  Sold / Cap
                </th>
                <th className="px-5 py-3 text-center text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  Fill Rate
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  Avg Price
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.tierStats.map((tier, idx) => (
                <tr
                  key={idx}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="px-5 py-4 text-zinc-900 font-bold text-sm">{tier.name}</td>
                  <td className="px-5 py-4 text-center font-mono text-sm text-zinc-600 font-semibold">
                    {tier.sold} / {tier.capacity}
                  </td>
                  <td className="px-5 py-4">
                    <div className="relative w-full h-5 bg-zinc-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-violet-600 transition-all duration-300"
                        style={{ width: `${Math.min(100, (tier.soldPercentage ?? 0) * 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-zinc-700">
                        {((tier.soldPercentage ?? 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-amber-600 font-semibold">
                    {formatNaira(tier.revenue ?? 0)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-zinc-600 font-semibold">
                    {formatNaira(tier.avgPrice ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Back Navigation */}
      <div className="pt-4 border-t border-zinc-100">
        <Link
          href={`/events/${eventId}`}
          className="text-violet-600 hover:text-violet-700 text-sm font-semibold transition-colors duration-150"
        >
          ← Back to event
        </Link>
      </div>
    </>
  )
}
