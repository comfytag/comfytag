'use client'

import { use } from 'react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { EventDetailClient } from '@/components/events/EventDetailClient'
import { ErrorMessage, LoadingSpinner } from '@comfytag/ui'
import { useEventById, useEventTierStats } from '@/hooks'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: eventId } = use(params)
  const { data: event, isLoading: eventLoading, isError: eventError, refetch: refetchEvent } = useEventById(eventId)
  const { data: tierStatsData, isLoading: tierStatsLoading, isError: tierStatsError } = useEventTierStats(eventId)

  const isLoading = eventLoading || tierStatsLoading

  if (isLoading) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (eventError || !event) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorMessage
          message="Failed to load event."
          onRetry={() => refetchEvent()}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb items={[{ label: 'Events', href: '/events' }, { label: event.name }]} />

      <EventDetailClient event={event} eventId={eventId} tierStats={tierStatsData as any} />
    </div>
  )
}
