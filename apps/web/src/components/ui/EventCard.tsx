'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import type { Event } from '@comfytag/types'
import { formatDate, formatTime, formatNaira } from '@comfytag/utils'

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
  const totalCap = event.ticketType.reduce((s, t) => s + t.capacity, 0)
  const soldPct = totalCap > 0 ? event.sold / totalCap : 0
  const imageSrc = event.coverImage ?? event.images[0] ?? '/placeholder.svg'

  const lowestPrice =
    event.ticketType.length > 0
      ? Math.min(...event.ticketType.map((t) => t.price))
      : 0

  const dateKicker = `${formatDate(event.date)} · ${formatTime(event.startTime)}`
  const categoryLabel = event.secondaryCategory
    ? `${event.category} · ${event.secondaryCategory}`
    : event.category
  const overline = categoryLabel ? `${categoryLabel} · ${dateKicker}` : dateKicker
  const isPast = !!(event.date || event.event_date) && new Date(event.date || event.event_date || '') < new Date()

  const topBadgeLabel = isSoldOut
    ? 'Sold Out'
    : isTrending
      ? 'Selling Fast'
      : soldPct > 0.5 && !isPast
        ? `${Math.round(soldPct * 100)}% sold`
        : null

  const content = (
    <article
      className="group relative block w-full aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden border border-transparent hover:border-brand transition-colors duration-(--duration-micro) ease-(--ease-standard) bg-zinc-900"
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
      {/* Full-bleed image */}
      <Image
        src={imageSrc}
        alt={event.name}
        fill
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        sizes={
          compact
            ? '(max-width: 768px) 50vw, 25vw'
            : '(max-width: 768px) 100vw, 50vw'
        }
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Top-left status badge */}
      {topBadgeLabel && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur text-zinc-900 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          {topBadgeLabel}
        </div>
      )}

      {/* Top-right heart button */}
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
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white"
        >
          <Heart
            className="w-4 h-4"
            fill={isLiked ? '#EF4444' : 'none'}
            stroke={isLiked ? '#EF4444' : 'white'}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      )}

      {/* Bottom content block */}
      <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col justify-end">
        {/* Date / time */}
        <p className="text-xs font-mono font-medium text-zinc-300 mb-1.5">{overline}</p>

        {/* Title */}
        <h3 className="text-md font-bold tracking-tight text-white line-clamp-2 leading-tight mb-2 capitalize">
          {event.name}
        </h3>

        {/* Headline tagline */}
        {event.headline && (
          <p className="text-sm text-zinc-300 line-clamp-2 leading-snug mb-3">{event.headline}</p>
        )}

        {/* Venue */}
        <p className="text-sm font-medium text-zinc-400 mb-5 truncate capitalize">{event.venue}</p>

        {/* Footer row — price + CTA */}
        <div className="flex items-center justify-between mt-auto">
          {lowestPrice === 0 ? (
            <span className="text-md font-bold text-white">Free</span>
          ) : (
            <span className="text-md font-bold text-white">{formatNaira(lowestPrice)}</span>
          )}

          <span className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors">
            {isPast ? 'View Recap' : 'Get Tickets'}
          </span>
        </div>
      </div>
    </article>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
      >
        {content}
      </Link>
    )
  }

  return content
}
