'use client'

import React from 'react'
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
    <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-50 text-orange-600 rounded-full shrink-0">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-zinc-900">Event Location</h2>
      </div>

      <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{fullAddress}</p>

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
    </div>
  )
}
