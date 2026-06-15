import { GateConsoleClient } from '@/components/events/GateConsoleClient'

interface GatePageProps {
  params: Promise<{ id: string }>
}

export default async function GatePage({ params }: GatePageProps) {
  const { id: eventId } = await params
  return <GateConsoleClient eventId={eventId} />
}
