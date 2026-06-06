'use client'

import React from 'react'
import { EventCard } from '@/components/ui/EventCard'
import { isUpcoming } from '@comfytag/utils'
import type { Event } from '@comfytag/types'

interface EditorPicksSectionProps {
  events: Event[]
}

export function EditorPicksSection({ events }: EditorPicksSectionProps) {
  if (!events || events.length === 0) return null

  // Filter to only upcoming, published events, then take first 4
  const featured = events
    .filter((e) => e.status === 'published' && isUpcoming(e.date))
    .slice(0, 4)

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)',
        padding: '64px 16px',
        marginBottom: '0',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '99px',
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
              backdropFilter: 'blur(4px)',
            }}
          >
            Editor&apos;s Picks
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-anybody), sans-serif',
              fontSize: '32px',
              fontWeight: 800, // NEW: Anybody font weight for boldness
              color: 'var(--color-text-on-brand)',
              marginBottom: '8px',
              letterSpacing: '-0.01em',
            }}
          >
            Curated by Our Team
          </h2>
          <p
            style={{
              color: 'var(--color-text-on-brand)',
              opacity: 0.85,
              fontSize: '16px',
              lineHeight: 1.6,
            }}
          >
            Events we think you&apos;ll absolutely love.
          </p>
        </div>

        {/* Cards grid — 4 columns on desktop, responsive */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {featured.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              href={`/events/${event.slug ?? event._id}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
