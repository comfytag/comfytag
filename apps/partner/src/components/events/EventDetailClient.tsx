'use client'

import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Event, TierStats } from '@comfytag/types'
import { EventDetailHeader } from './EventDetailHeader'
import { EventDetailStats } from './EventDetailStats'
import { TierBreakdownSection } from './TierBreakdownSection'
import { AttendeesSection } from './AttendeesSection'
import { EventRecapSection } from './EventRecapSection'
import api, { authHeader } from '@/lib/api'

interface EventDetailClientProps {
  event: Event
  eventId: string
  tierStats: { eventId: string; tiers: TierStats[] } | null
}

export function EventDetailClient({ event, eventId, tierStats }: EventDetailClientProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: (status: 'published' | 'draft' | 'cancelled') =>
      api.patch('/events/' + eventId, { status }, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', session?.user?.id] })
    },
  })

  return (
    <>
      <EventDetailHeader
        event={event}
        eventId={eventId}
        onStatusChange={(status) => statusMutation.mutate(status)}
        isStatusPending={statusMutation.isPending}
      />

      <EventDetailStats event={event} />

      {tierStats?.tiers && tierStats.tiers.length > 0 && (
        <TierBreakdownSection tiers={tierStats.tiers} />
      )}

      <AttendeesSection eventId={eventId} />

      {event.status === 'ended' && <EventRecapSection eventId={eventId} />}
    </>
  )
}
