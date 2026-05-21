import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@comfytag/ui'
import type { Event } from '@comfytag/types'

export interface EventCardProps {
  event: Event
  href: string
}

const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

function CalendarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function EventCard({ event, href }: EventCardProps) {
  const coverImage = event.images?.[0] ?? event.coverImage
  const displayDate = event.date ? fmt.format(new Date(event.date)) : ''

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        textDecoration: 'none',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 200ms ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-brand)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'
      }}
    >
      <div style={{ position: 'relative', height: '160px' }}>
        {coverImage ? (
          <Image
            src={coverImage}
            alt={event.name}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--color-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {event.name}
        </div>

        {displayDate && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CalendarIcon size={14} />
            {displayDate}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
          }}
        >
          <Badge status={event.status} />
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {event.sold ?? 0} sold
          </span>
        </div>
      </div>
    </Link>
  )
}
