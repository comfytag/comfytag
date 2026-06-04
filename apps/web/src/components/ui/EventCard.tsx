'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@comfytag/types'
import { formatDate, formatTime } from '@comfytag/utils'

export interface EventCardProps {
  event: Event
  href?: string
  compact?: boolean
  isTrending?: boolean
  isSoldOut?: boolean
  onSelect?: () => void
  isLiked?: boolean
  onLike?: (eventId: string) => Promise<void> | void
}

export function EventCard({
  event,
  href,
  compact = false,
  isTrending = false,
  isSoldOut = false,
  onSelect,
  isLiked = false,
  onLike,
}: EventCardProps) {
  const [hovered, setHovered] = React.useState(false)

  const totalCap = event.ticketType.reduce((s, t) => s + t.capacity, 0)
  const soldPct = totalCap > 0 ? event.sold / totalCap : 0
  const imageSrc = event.coverImage ?? event.images[0] ?? '/placeholder.svg'

  const height = compact ? 180 : 240

  const content = (
    <>
      <style>{`
        .__ct_eventcard { text-decoration: none; display: block; }
        .__ct_eventcard:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; border-radius: 16px; }
      `}</style>
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'block',
          height: `${height}px`,
          transform: hovered ? 'scale(1.02)' : 'scale(1)',
          transition: `transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease`,
          boxShadow: hovered
            ? 'var(--shadow-md)'
            : 'none',
          cursor: onSelect ? 'pointer' : 'default',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onSelect}
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onKeyDown={(e) => {
          if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onSelect()
          }
        }}
      >
        {/* Image — 16:9 full-bleed */}
        <Image
          src={imageSrc}
          alt={event.name}
          fill
          style={{ objectFit: 'cover' }}
          sizes={compact ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 768px) 100vw, 50vw'}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          }}
        />

        {/* FOMO pill overlay — conditional */}
        {(isTrending || isSoldOut) && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: isSoldOut ? 'rgba(0,0,0,0.7)' : 'var(--color-energy)',
              color: isSoldOut ? 'var(--color-text-muted)' : 'var(--color-text)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backdropFilter: 'blur(4px)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {isSoldOut ? 'Sold Out' : 'Trending'}
          </div>
        )}

        {/* Bottom content */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: compact ? '12px' : '16px',
          }}
        >
          {/* Event name — bold, 17px / 700 weight */}
          <div
            style={{
              color: 'var(--color-text-on-brand)',
              fontSize: '17px',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '6px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {event.name}
          </div>

          {/* Date + venue — muted */}
          <div
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '12px',
              lineHeight: 1.4,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <div>{formatDate(event.date)} at {formatTime(event.startTime)}</div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.venue}
            </div>
          </div>
        </div>

        {/* Like button — top right corner */}
        {onLike && (
          <button
            type="button"
            aria-label={isLiked ? 'Unlike event' : 'Like event'}
            aria-pressed={isLiked}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void onLike(event._id)
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              color: isLiked ? 'var(--color-error)' : 'var(--color-text-on-brand)',
              transition: 'color var(--duration-fast) ease',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}

        {/* Capacity progress bar — bottom edge */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'var(--color-border)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(soldPct * 100, 100)}%`,
              background: 'var(--color-brand)',
              transition: 'width var(--duration-default) ease',
            }}
          />
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className="__ct_eventcard">
        {content}
      </Link>
    )
  }

  return content
}
