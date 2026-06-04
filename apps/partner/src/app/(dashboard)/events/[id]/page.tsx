import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { EventDetailClient } from '@/components/events/EventDetailClient'
import type { Event } from '@comfytag/types'
import { ErrorMessage } from '@comfytag/ui'
import { getServerSession } from 'next-auth'
import api, { authHeader } from '@/lib/api'

interface TierStats {
  _id: string
  tierName: string
  sold: number
  capacity: number
}

interface TierStatsResponse {
  eventId: string
  tiers: TierStats[]
}

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const session = await getServerSession()
  const { id: eventId } = await params

  let event: Event | null = null
  let tierStats: TierStatsResponse | null = null

  try {
    const eventRes = await api.get<Event>(`/events/${eventId}`, authHeader(session?.user?.token as string))
    event = eventRes.data
  } catch {
    event = null
  }

  if (!event) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorMessage message="Failed to load event." />
      </div>
    )
  }

  try {
    const statsRes = await api.get<TierStatsResponse>(
      `/events/${eventId}/tiers/stats`,
      authHeader(session?.user?.token as string)
    )
    tierStats = statsRes.data
  } catch {
    tierStats = null
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb items={[{ label: 'Events', href: '/events' }, { label: event.name }]} />

      <EventDetailClient event={event} eventId={eventId} tierStats={tierStats as any} />
    </div>
  )
}
