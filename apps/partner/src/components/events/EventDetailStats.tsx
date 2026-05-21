'use client'

import { Users, Archive, Banknote, Ticket } from 'lucide-react'
import { StatCard } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { formatNaira } from '@comfytag/utils'

interface EventDetailStatsProps {
  event: Event
}

export function EventDetailStats({ event }: EventDetailStatsProps) {
  const totalCapacity = (event.ticketType ?? []).reduce((s, t) => s + t.capacity, 0)
  const avgTierPrice = event.ticketType?.length
    ? event.ticketType.reduce((s, t) => s + t.price, 0) / event.ticketType.length
    : 0
  const estimatedRevenue = (event.sold ?? 0) * avgTierPrice
  const available = Math.max(0, totalCapacity - (event.sold ?? 0))

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}
    >
      <StatCard
        icon={Users}
        value={(event.sold ?? 0).toLocaleString('en-NG')}
        label="Tickets Sold"
      />
      <StatCard
        icon={Archive}
        value={available.toLocaleString('en-NG')}
        label="Available"
      />
      <StatCard
        icon={Banknote}
        value={formatNaira(estimatedRevenue)}
        label="Est. Revenue"
      />
      <StatCard
        icon={Ticket}
        value={totalCapacity.toLocaleString('en-NG')}
        label="Total Capacity"
      />
    </div>
  )
}
