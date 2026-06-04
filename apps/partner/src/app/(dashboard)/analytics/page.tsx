'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatNaira } from '@comfytag/utils'
import { ChartCard } from '@/components/ui/ChartCard'
import api, { authHeader } from '@/lib/api'

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
// AnalyticsPage (thin composer)
// ─────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [expandedTicketType, setExpandedTicketType] = useState<string | null>(null)

  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ['partnerAnalytics', session?.user.id],
    queryFn: () =>
      api
        .get<PartnerAnalytics>(`/partner/${session!.user.id}/analytics`, authHeader(session?.user.token))
        .then((r) => r.data),
    enabled: !!session?.user.id,
  })

  if (isLoading) {
    return (
      <div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner centered size="lg" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <div style={{ padding: '32px 24px' }}>
          <ErrorMessage message="Failed to load analytics." />
        </div>
      </div>
    )
  }

  const ticketTypes = analytics?.ticketTypes ?? []

  return (
    <div>
      <main style={{ flex: 1, padding: '32px 24px' }}>
        {/* Max-width container */}
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Page Title */}
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 32px', letterSpacing: '-0.02em' }}>
            ANALYTICS
          </h1>

          {/* Top Stats Grid: flexible wrap on desktop, stack on mobile */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            {/* Sales Chart */}
            <ChartCard title="Sales" subtitle="Revenue over time">
              <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '6px', justifyContent: 'space-around' }}>
                {(analytics?.monthlyRevenue ?? []).map((item, idx) => {
                  const maxRev = Math.max(...(analytics?.monthlyRevenue ?? [{ revenue: 1 }]).map((m) => m.revenue))
                  const h = ((item.revenue || 0) / maxRev) * 200
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(h, 20)}px`,
                          backgroundColor: 'var(--color-brand)',
                          borderRadius: '4px',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {new Date(item.month + '-01').toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </ChartCard>

            {/* Total Orders */}
            <ChartCard title="Orders" subtitle="Total tickets sold">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-brand)', lineHeight: 1 }}>
                    {(analytics?.totalTicketsSold ?? 0).toLocaleString('en-NG')}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '12px 0 0' }}>
                    tickets across all events
                  </p>
                </div>
              </div>
            </ChartCard>

            {/* Followers */}
            <ChartCard title="Followers" subtitle="Profile followers">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-brand)', lineHeight: 1 }}>
                    {(analytics?.followers ?? 0).toLocaleString('en-NG')}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '12px 0 0' }}>
                    total followers
                  </p>
                </div>
              </div>
            </ChartCard>

            {/* Total Events */}
            <ChartCard title="Events" subtitle="Total created events">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-brand)', lineHeight: 1 }}>
                    {(analytics?.totalEvents ?? 0).toLocaleString('en-NG')}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '12px 0 0' }}>
                    all-time events
                  </p>
                </div>
              </div>
            </ChartCard>

            {/* Average Order Value */}
            <ChartCard title="Avg Order Value" subtitle="Per ticket revenue">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-brand)', lineHeight: 1 }}>
                    {(analytics?.averageTicketPrice ?? 0) > 0
                      ? formatNaira(analytics?.averageTicketPrice ?? 0)
                      : '₦0'}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '12px 0 0' }}>
                    average price per ticket
                  </p>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--color-border)', margin: '24px 0 40px' }} />

          {/* Detailed Breakdown */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              DETAILED BREAKDOWN
            </h2>

            {ticketTypes.length === 0 ? (
              <div
                style={{
                  padding: '32px 24px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '14px',
                }}
              >
                No ticket type data available
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ticketTypes.map((ticketType) => {
                  const percentageSold = (ticketType.sold / ticketType.capacity) * 100
                  const avgPrice = ticketType.sold > 0 ? ticketType.revenue / ticketType.sold : 0
                  const isExpanded = expandedTicketType === ticketType.name

                  return (
                    <div
                      key={ticketType.name}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Collapsible Row */}
                      <button
                        onClick={() =>
                          setExpandedTicketType(isExpanded ? null : ticketType.name)
                        }
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-text)',
                          fontSize: '14px',
                          fontWeight: 500,
                        }}
                      >
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                            {ticketType.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {ticketType.sold} / {ticketType.capacity} sold ({percentageSold.toFixed(0)}%)
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', marginRight: '16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-brand)' }}>
                            {formatNaira(ticketType.revenue)}
                          </div>
                        </div>

                        {/* Chevron Icon */}
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 150ms ease',
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: '16px 20px',
                            borderTop: '1px solid var(--color-border)',
                            background: 'var(--color-surface-2)',
                            fontSize: '13px',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                Revenue
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                                {formatNaira(ticketType.revenue)}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                Avg Price per Ticket
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                                {formatNaira(avgPrice)}
                              </div>
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
      </main>
    </div>
  )
}
