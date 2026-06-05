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
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (analyticsError || !analytics) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorMessage
          message="Failed to load analytics."
          onRetry={() => refetchAnalytics()}
        />
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
