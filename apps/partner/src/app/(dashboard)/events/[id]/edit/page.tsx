import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { EditEventForm } from '@/components/events/EditEventForm'
import { PageHeader, ErrorMessage } from '@comfytag/ui'
import { ChevronLeft } from 'lucide-react'
import type { Event } from '@comfytag/types'
import { getServerSession } from 'next-auth'
import api, { authHeader } from '@/lib/api'

interface EditEventPageProps {
  params: { id: string }
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const session = await getServerSession()
  const eventId = params.id

  let event: Event | null = null

  try {
    const res = await api.get<Event>(`/events/${eventId}`, authHeader(session?.user?.token as string))
    event = res.data
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

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${eventId}` },
          { label: 'Edit' },
        ]}
      />

      <PageHeader
        title="Edit Event"
        subtitle="Update your event details"
        action={
          <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ChevronLeft size={16} />
            <a href={`/events/${eventId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              Back
            </a>
          </div>
        }
      />

      <EditEventForm event={event} eventId={eventId} />
    </div>
  )
}
