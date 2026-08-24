'use client'

import { use } from 'react'
import { EventDetailClient } from '@/components/events/EventDetailClient'
import { ErrorMessage, LoadingSpinner } from '@comfytag/ui'
import { useEventById, useEventTierStats } from '@/hooks'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id: eventId } = use(params)
  const { data: event, isLoading: eventLoading, isError: eventError, refetch: refetchEvent } = useEventById(eventId)
  const { data: tierStatsData, isLoading: tierStatsLoading } = useEventTierStats(eventId)

  const isLoading = eventLoading || tierStatsLoading

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ErrorMessage
          message="Failed to load event."
          onRetry={() => refetchEvent()}
        />
      </div>
    )
  }

  return (
    <EventDetailClient
      event={event}
      eventId={eventId}
      tierStats={tierStatsData ?? null}
    />
  )
}
