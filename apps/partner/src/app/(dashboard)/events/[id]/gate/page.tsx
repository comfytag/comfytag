import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { GateStats } from '@/components/events/GateStats'
import { GateAttendeesPanel } from '@/components/events/GateAttendeesPanel'
import { PageHeader, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { getServerSession } from 'next-auth'
import api, { authHeader } from '@/lib/api'

interface CheckInStats {
  eventId: string
  totalCapacity: number
  totalCheckedIn: number
  totalAttendees: number
}

interface Attendee {
  _id: string
  name: string
  email: string
  numOfTicket: number
  checkedIn?: boolean
  checkInDate?: string
}

interface GatePageProps {
  params: { id: string }
}

export default async function GatePage({ params }: GatePageProps) {
  const session = await getServerSession()
  const eventId = params.id

  let stats: CheckInStats | null = null
  let attendees: Attendee[] | null = null
  let hasError = false

  try {
    const statsRes = await api.get<CheckInStats>(
      `/events/${eventId}/checkin-stats`,
      authHeader(session?.user?.token as string)
    )
    stats = statsRes.data
  } catch {
    hasError = true
  }

  try {
    const attendeesRes = await api.get<Attendee[]>(
      `/audience/event/${eventId}`,
      { params: { limit: 200 }, ...authHeader(session?.user?.token as string) }
    )
    attendees = attendeesRes.data
  } catch {
    hasError = true
  }

  if (hasError || !stats || !attendees) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorMessage message="Failed to load check-in data." />
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: 'Event', href: `/events/${eventId}` },
          { label: 'Gate Management' },
        ]}
      />

      <PageHeader title="Gate Management" subtitle="Real-time check-in tracking and management" />

      <GateStats stats={stats} />

      <GateAttendeesPanel attendees={attendees} eventId={eventId} />
    </div>
  )
}
