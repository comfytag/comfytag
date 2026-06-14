'use client'

import React from 'react'
import { Divider } from '@/components/events/EventIcons'
import type { Event } from '@comfytag/types'

interface EventLocationProps {
  event: Event
}

const rideLinks = (destination: string) => [
  {
    label: '🗺️ Open in Maps',
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`,
  },
  {
    label: '⚡ Bolt',
    href: `https://bolt.eu/en/?destination=${encodeURIComponent(destination)}`,
  },
  {
    label: '🚗 Uber',
    href: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(destination)}`,
  },
]

export function EventLocation({ event }: EventLocationProps) {
  const fullAddress = [event.venue, event.address, event.state].filter(Boolean).join(', ')
  const destination = event.address ?? event.venue

  return (
    <>
      <Divider />
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px' }}>
        Location
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
        {fullAddress}
      </p>
      <div className="flex flex-wrap gap-2">
        {rideLinks(destination).map(({ label, href }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
          >
            {label}
          </a>
        ))}
      </div>
    </>
  )
}
