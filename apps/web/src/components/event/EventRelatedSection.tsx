'use client'

import React from 'react'
import { EventCard } from '@/components/ui'
import { Divider } from '@/components/events/EventIcons'
import type { Event } from '@comfytag/types'

interface EventRelatedSectionProps {
  events: Event[]
}

export function EventRelatedSection({ events }: EventRelatedSectionProps) {
  if (events.length === 0) return null

  return (
    <>
      <Divider />
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 14px' }}>
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
    </>
  )
}
