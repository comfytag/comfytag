'use client'

import React from 'react'
import { EventCard } from '@/components/ui'
import type { Event } from '@comfytag/types'

interface EventRelatedSectionProps {
  events: Event[]
}

export function EventRelatedSection({ events }: EventRelatedSectionProps) {
  if (events.length === 0) return null

  return (
    <div>
      <h2 className="text-xl font-bold text-(--color-text) border-l-4 border-brand pl-4 mb-4">
        More like this
      </h2>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {events.map((e) => (
          <div key={e._id} style={{ flexShrink: 0, width: '220px' }}>
            <EventCard event={e} href={`/events/${e.slug ?? e._id}`} isLiked={false} compact />
          </div>
        ))}
      </div>
    </div>
  )
}
