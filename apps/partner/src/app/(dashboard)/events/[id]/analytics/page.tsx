'use client'

import { use } from 'react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { EventAnalyticsClient } from '@/components/events/EventAnalyticsClient'
import { ErrorMessage, LoadingSpinner } from '@comfytag/ui'
import { useEventAnalytics, useEventById } from '@/hooks'

interface EventAnalyticsPageProps {
  params: Promise<{ id: string }>
}

export default function EventAnalyticsPage({ params }: EventAnalyticsPageProps) {
  const { id: eventId } = use(params)
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics } = useEventAnalytics(eventId)
  const { data: event, isLoading: eventLoading } = useEventById(eventId)

  const isLoading = analyticsLoading || eventLoading
  const eventName = event?.name || 'Event'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (analyticsError || !analytics) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <ErrorMessage
          message="Failed to load analytics."
          onRetry={() => refetchAnalytics()}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: eventName, href: `/events/${eventId}` },
          { label: 'Analytics' },
        ]}
      />
      <div className="mt-6">
        <EventAnalyticsClient analytics={analytics} eventId={eventId} />
      </div>
    </div>
  )
}
