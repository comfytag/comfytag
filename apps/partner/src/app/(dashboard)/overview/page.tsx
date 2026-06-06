'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatNaira } from '@comfytag/utils'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { ChartCard } from '@/components/ui/ChartCard'
import { EventCard } from '@/components/ui/EventCard'
import { usePartnerProfile, usePartnerRevenue, usePartnerAnalytics, useMyEvents } from '@/hooks'

function getGreeting(): string {
  const now = new Date()
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function OverviewPage() {
  const { data: session } = useSession()
  const { data: organizer, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = usePartnerProfile()
  const { data: revenue, isLoading: revenueLoading, isError: revenueError, refetch: refetchRevenue } = usePartnerRevenue()
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics } = usePartnerAnalytics()
  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useMyEvents()

  const upcomingEvents = events
    .filter((e) => new Date(e.date) > new Date() && e.status === 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6)

  const organizerName = organizer?.name || session?.user?.name || 'Organizer'

  const isLoading = profileLoading || revenueLoading || analyticsLoading || eventsLoading

  if (isLoading) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (profileError || revenueError || analyticsError || eventsError) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <ErrorMessage
          message="Failed to load dashboard data. Please try again."
          onRetry={() => {
            refetchProfile()
            refetchRevenue()
            refetchAnalytics()
            refetchEvents()
          }}
        />
      </div>
    )
  }

  return (
    <main
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
      }}
    >
      {/* Greeting */}
      <div
        style={{
          paddingTop: '32px',
          paddingBottom: '16px',
          fontFamily: 'var(--font-anybody), sans-serif', // NEW: Bold Anybody font
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--color-text)',
        }}
      >
        {getGreeting()}, {organizerName}.
      </div>

        {/* Stats Grid: 4 cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <ChartCard title="Total Revenue" subtitle="All-time earnings">
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--color-gold)',
                lineHeight: 1,
              }}
            >
              {formatNaira(revenue?.totalRevenue ?? 0)}
            </div>
          </ChartCard>

          <ChartCard title="Tickets Sold" subtitle="All-time tickets sold">
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--color-text)',
                lineHeight: 1,
              }}
            >
              {(revenue?.totalTicketsSold ?? 0).toLocaleString('en-NG')}
            </div>
          </ChartCard>

          <ChartCard title="Total Events" subtitle="Events created">
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--color-brand)',
                lineHeight: 1,
              }}
            >
              {(revenue?.totalEvents ?? 0).toLocaleString('en-NG')}
            </div>
          </ChartCard>

          <ChartCard title="Followers" subtitle="Organizer followers">
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--color-text)',
                lineHeight: 1,
              }}
            >
              {(analytics?.followers ?? 0).toLocaleString('en-NG')}
            </div>
          </ChartCard>
        </div>

        {/* Upcoming Events Section */}
        <section
          style={{
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-anybody), sans-serif', // NEW: Bold Anybody font
                margin: 0,
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--color-text)',
              }}
            >
              YOUR UPCOMING EVENTS
            </h2>
          </div>

          {upcomingEvents.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  status={event.status === 'published' ? 'live' : 'draft'}
                  onEdit={() => {
                    window.location.href = `/events/${event._id}/edit`
                  }}
                />
              ))}

              {/* Create New Event Button */}
              <Link
                href="/events/create"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  aspectRatio: '4/5',
                  background: 'var(--color-surface)',
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) ease',
                  textDecoration: 'none',
                  flexDirection: 'column',
                  gap: '8px',
                  color: 'var(--color-text-muted)',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
                    'var(--color-brand)'
                  ;(e.currentTarget as HTMLAnchorElement).style.color =
                    'var(--color-brand)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
                    'var(--color-border)'
                  ;(e.currentTarget as HTMLAnchorElement).style.color =
                    'var(--color-text-muted)'
                }}
              >
                <span style={{ fontSize: '24px' }}>+</span>
                Create New Event
              </Link>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '16px',
              }}
            >
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: '14px',
                  color: 'var(--color-text-muted)',
                }}
              >
                No upcoming events yet
              </p>
              <Link
                href="/events/create"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: 'var(--color-brand)',
                  color: 'var(--color-text-on-brand)',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Create First Event
              </Link>
            </div>
          )}
      </section>

    </main>
  )
}

