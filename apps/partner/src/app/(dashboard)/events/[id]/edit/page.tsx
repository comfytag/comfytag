import { EditEventClient } from '@/components/events/EditEventClient'

interface EditEventPageProps {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id: eventId } = await params
  return <EditEventClient eventId={eventId} />
}
