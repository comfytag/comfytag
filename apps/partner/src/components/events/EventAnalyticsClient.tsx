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
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
          {analytics.eventName}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
          Event performance analytics
        </p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <ChartCard title="Total Revenue" subtitle="Event earnings">
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-gold)', lineHeight: 1 }}>
            {formatNaira(analytics.totalRevenue)}
          </div>
        </ChartCard>

        <ChartCard title="Tickets Sold" subtitle={`/ ${analytics.totalCapacity} capacity`}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>
            {analytics.totalTicketsSold}
          </div>
        </ChartCard>

        <ChartCard title="Check-In Rate" subtitle={`${analytics.checkInCount} checked in`}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-brand)', lineHeight: 1 }}>
            {analytics.checkInRate.toFixed(1)}%
          </div>
        </ChartCard>

        <ChartCard title="Checked In" subtitle="Attendees verified">
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>
            {analytics.checkInCount}
          </div>
        </ChartCard>
      </div>

      {/* Daily Sales Chart */}
      {analytics.dailySales && analytics.dailySales.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px 0' }}>
            Daily Sales
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: `${barGap}px`,
              height: `${chartHeight}px`,
              padding: '16px 0',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '12px',
            }}
          >
            {analytics.dailySales.map((day, idx) => {
              const barHeight = (day.revenue / maxDailySales) * (chartHeight - 40)
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${barHeight}px`,
                    backgroundColor: 'var(--color-brand)',
                    borderRadius: '4px 4px 0 0',
                    minWidth: `${barWidth}px`,
                    position: 'relative',
                    transition: 'opacity var(--duration-fast) ease',
                    cursor: 'pointer',
                  }}
                  title={`${new Date(day.date).toLocaleDateString('en-GB')}: ${day.sold} tickets, ${formatNaira(day.revenue)}`}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.opacity = '0.7'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.opacity = '1'
                  }}
                />
              )
            })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            {analytics.dailySales.length} days of sales data
          </div>
        </div>
      )}

      {/* Tier Performance Table */}
      {analytics.tierStats && analytics.tierStats.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '32px',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
              Ticket Tier Performance
            </h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tier</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Sold / Capacity</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Sold %</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Revenue</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {analytics.tierStats.map((tier, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-surface-2)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                    {tier.name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'center' }}>
                    {tier.sold} / {tier.capacity}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '24px',
                        backgroundColor: 'var(--color-surface-2)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, (tier.soldPercentage ?? 0) * 100)}%`,
                          backgroundColor: 'var(--color-brand)',
                          transition: 'width var(--duration-fast) ease',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--color-text)',
                        }}
                      >
                        {((tier.soldPercentage ?? 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-gold)', fontWeight: 600, textAlign: 'right' }}>
                    {formatNaira(tier.revenue ?? 0)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                    {formatNaira(tier.avgPrice ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Navigation */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
        <Link
          href={`/events/${eventId}`}
          style={{
            display: 'inline-block',
            color: 'var(--color-brand)',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'color var(--duration-fast) ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-brand-dark)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-brand)'
          }}
        >
          ← Back to event
        </Link>
      </div>
    </>
  )
}
