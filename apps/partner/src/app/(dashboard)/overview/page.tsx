import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { formatNaira } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import { ChartCard } from '@/components/ui/ChartCard'
import { EventCard } from '@/components/ui/EventCard'
import api, { authHeader } from '@/lib/api'

interface PartnerRevenue {
  userId: string
  totalRevenue: number
  totalTicketsSold: number
  totalEvents: number
  pendingWithdrawals: number
  approvedWithdrawals: number
  sentWithdrawals: number
  availableBalance: number
}

interface PartnerAnalytics {
  userId: string
  totalLifetimeRevenue: number
  totalEvents: number
  totalTicketsSold: number
  followers: number
  averageTicketPrice: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  topEvents: Array<{ eventId: string; eventName: string; revenue: number }>
}

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

  let organizer = null
  try {
    const res = await api.get(`/users/${userId}`, { ...authHeader(token) })
    organizer = res.data
  } catch {}

  let revenue: PartnerRevenue | null = null
  try {
    const res = await api.get<PartnerRevenue>(`/partner/${userId}/revenue`, { ...authHeader(token) })
    revenue = res.data
  } catch {}

  let analytics: PartnerAnalytics | null = null
  try {
    const res = await api.get<PartnerAnalytics>(`/partner/${userId}/analytics`, { ...authHeader(token) })
    analytics = res.data
  } catch {}

  let upcomingEvents: Event[] = []
  try {
    const res = await api.get<Event[]>(`/events/user/${userId}`, {
      params: { status: 'published', limit: 6 },
      ...authHeader(token),
    })
    upcomingEvents = res.data
      .filter((e) => new Date(e.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch {}

  const organizerName = organizer?.name || session.user.name || 'Organizer'

  return (
    <>
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
    </>
  )
}
