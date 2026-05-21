'use client'

import React from 'react'
import { TrendingUp, Calendar, Ticket, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { LoadingSpinner, ErrorMessage, PageHeader, StatCard } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import api, { authHeader } from '@/lib/api'

interface PartnerAnalytics {
  totalRevenue: number
  totalEvents: number
  totalTicketsSold: number
  totalFollowers: number
  monthlyRevenue: { month: string; revenue: number }[]
  topEvents: { name: string; revenue: number; sold: number }[]
}

export default function AnalyticsPage() {
  const { data: session } = useSession()

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
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <ErrorMessage message="Failed to load analytics." />
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb items={[{ label: 'Analytics' }]} />
      <PageHeader title="Analytics" subtitle="Your event performance and revenue insights" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard
          icon={TrendingUp}
          title="Total Revenue"
          value={formatNaira(analytics?.totalRevenue ?? 0)}
          change="+12% this month"
        />
        <StatCard
          icon={Calendar}
          title="Total Events"
          value={(analytics?.totalEvents ?? 0).toString()}
          change="All time"
        />
        <StatCard
          icon={Ticket}
          title="Tickets Sold"
          value={(analytics?.totalTicketsSold ?? 0).toLocaleString('en-NG')}
          change="Across all events"
        />
        <StatCard
          icon={Users}
          title="Followers"
          value={(analytics?.totalFollowers ?? 0).toLocaleString('en-NG')}
          change="Following your events"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Monthly Revenue Chart */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px 0' }}>
            Revenue Trend
          </h3>
          <div style={{ minHeight: '250px', display: 'flex', alignItems: 'flex-end', gap: '4px', justifyContent: 'space-around' }}>
            {(analytics?.monthlyRevenue ?? []).map((item, idx) => {
              const maxRevenue = Math.max(...(analytics?.monthlyRevenue ?? []).map((m) => m.revenue))
              const height = (item.revenue / maxRevenue) * 200
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(height, 20)}px`,
                      backgroundColor: 'var(--color-brand)',
                      borderRadius: '4px',
                      transition: 'background-color 150ms',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-brand)'
                      ;(e.currentTarget.parentElement?.nextElementSibling as HTMLDivElement).style.opacity = '1'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    {item.month.slice(0, 3)}
                  </span>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text)',
                      opacity: 0.6,
                      transition: 'opacity 150ms',
                      textAlign: 'center',
                    }}
                  >
                    {formatNaira(item.revenue)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Events */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px 0' }}>
            Top Events
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(analytics?.topEvents ?? []).slice(0, 5).map((event, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--color-surface-2)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {event.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {event.sold} tickets sold
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-brand)' }}>
                    {formatNaira(event.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
