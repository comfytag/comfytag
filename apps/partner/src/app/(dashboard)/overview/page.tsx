import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { formatNaira } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import type { ActivityItem } from '@/components/dashboard/ActivityFeed'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { ChartCard } from '@/components/ui/ChartCard'
import { EventCard } from '@/components/ui/EventCard'
import PartnerNav from '@/components/dashboard/PartnerNav'
import api, { authHeader } from '@/lib/api'

interface DashboardStats {
  totalRevenue: number
  ticketsSoldThisMonth: number
}

interface Activity {
  _id: string
  type: 'purchase' | 'comment' | 'warning'
  description: string
  timestamp: string
}

/**
 * Helper: Get greeting based on time of day
 */
function getGreeting(): string {
  const now = new Date()
  const hour = now.getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function OverviewPage() {
  const session = await getServerSession()
  if (!session?.user) notFound()

  const userId = session.user.id as string
  const token = session.user.token as string

  // Fetch organizer data
  let organizer = null
  try {
    const res = await api.get(`/users/${userId}`, {
      ...authHeader(token),
    })
    organizer = res.data
  } catch {
    // Log error but continue — page shows defaults
  }

  // Fetch dashboard stats
  let stats: DashboardStats = {
    totalRevenue: 0,
    ticketsSoldThisMonth: 0,
  }
  try {
    const res = await api.get(`/partner/${userId}/stats`, {
      ...authHeader(token),
    })
    stats = res.data
  } catch {
    // Fallback to defaults
  }

  // Fetch upcoming events (next 6)
  let upcomingEvents: Event[] = []
  try {
    const res = await api.get<Event[]>(`/events/user/${userId}`, {
      params: { status: 'published', limit: 6 },
      ...authHeader(token),
    })
    upcomingEvents = res.data
      .filter((e) => new Date(e.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch {
    // Fallback to empty list
  }

  // Fetch activity feed (last 10 activities)
  let activities: ActivityItem[] = []
  try {
    const res = await api.get<Activity[]>(`/partner/${userId}/activities`, {
      params: { limit: 10 },
      ...authHeader(token),
    })
    activities = res.data.map((a) => ({
      id: a._id,
      type: a.type,
      description: a.description,
      timestamp: a.timestamp,
    }))
  } catch {
    // Fallback to empty list
  }

  const organizerName = organizer?.name || session.user.name || 'Organizer'

  return (
    <>
      <PartnerNav />

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
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          {getGreeting()}, {organizerName}.
        </div>

        {/* Stats Grid: 2 cards side-by-side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <ChartCard title="Total Revenue" subtitle="All-time earnings">
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--color-brand)',
                lineHeight: 1,
              }}
            >
              {formatNaira(stats.totalRevenue)}
            </div>
          </ChartCard>

          <ChartCard title="Tickets Sold This Month" subtitle="Current month">
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: 'var(--color-text)',
                lineHeight: 1,
              }}
            >
              {stats.ticketsSoldThisMonth.toLocaleString('en-NG')}
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
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
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
                    // Placeholder for edit action
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

        {/* Activity Feed Section */}
        <section
          style={{
            marginBottom: '40px',
          }}
        >
          <ActivityFeed
            activities={activities}
            title="RECENT ACTIVITY"
            live={false}
          />
        </section>
      </main>
    </>
  )
}
