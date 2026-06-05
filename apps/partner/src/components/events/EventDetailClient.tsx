'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Event, TierStats } from '@comfytag/types'
import { EventDetailHeader } from './EventDetailHeader'
import { EventDetailStats } from './EventDetailStats'
import { TierBreakdownSection } from './TierBreakdownSection'
import { AttendeesSection } from './AttendeesSection'
import { EventRecapSection } from './EventRecapSection'
import { api } from '@/lib/api'

interface EventDetailClientProps {
  event: Event
  eventId: string
  tierStats: { eventId: string; tiers: TierStats[] } | null
}

export function EventDetailClient({ event, eventId, tierStats }: EventDetailClientProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [currentStatus, setCurrentStatus] = useState(event.status as Event['status'])

  const statusMutation = useMutation({
    mutationFn: (status: 'published' | 'draft' | 'cancelled') =>
      api.patch('/events/' + eventId, { status }).then(r => r.data),
    onSuccess: (_data, status) => {
      setCurrentStatus(status)
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', session?.user?.id] })
    },
    onError: () => {
      alert('Failed to update event status. Please try again.')
    },
  })

  const liveEvent = { ...event, status: currentStatus }

  return (
    <>
      <EventDetailHeader
        event={liveEvent}
        eventId={eventId}
        onStatusChange={(status) => statusMutation.mutate(status)}
        isStatusPending={statusMutation.isPending}
      />

      <EventDetailStats event={liveEvent} />

      {tierStats?.tiers && tierStats.tiers.length > 0 && (
        <TierBreakdownSection tiers={tierStats.tiers} />
      )}

      <AttendeesSection eventId={eventId} />

      {event.status === 'ended' && <EventRecapSection eventId={eventId} />}
    </>
  )
}

