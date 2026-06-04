import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { EventAnalyticsClient } from '@/components/events/EventAnalyticsClient'
import { ErrorMessage } from '@comfytag/ui'
import api, { authHeader } from '@/lib/api'
import type { Event } from '@comfytag/types'

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

interface EventAnalyticsPageProps {
  params: Promise<{ id: string }>
}

export default async function EventAnalyticsPage({ params }: EventAnalyticsPageProps) {
  const session = await getServerSession(authOptions)
  const { id: eventId } = await params

  let analytics: EventAnalytics | null = null
  let eventName = 'Event'

  try {
    const [aRes, eRes] = await Promise.all([
      api.get<EventAnalytics>(`/events/${eventId}/analytics`, authHeader(session?.user?.token as string)),
      api.get<Event>(`/events/${eventId}`, authHeader(session?.user?.token as string)),
    ])
    analytics = aRes.data
    eventName = eRes.data.name
  } catch {}

  if (!analytics) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorMessage message="Failed to load analytics." />
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: eventName, href: `/events/${eventId}` },
          { label: 'Analytics' },
        ]}
      />
      <EventAnalyticsClient analytics={analytics} eventId={eventId} />
    </div>
  )
}
