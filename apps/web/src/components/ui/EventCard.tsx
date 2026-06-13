'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Heart } from 'lucide-react'
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

  const dateKicker = `${formatDate(event.date)} • ${formatTime(event.startTime)}`

  const content = (
    <article
      className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
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
      {/* Top: Image area — zooms on group hover */}
      <div className="relative w-full aspect-4/3 overflow-hidden bg-zinc-100 shrink-0">
        <Image
          src={imageSrc}
          alt={event.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes={
            compact
              ? '(max-width: 768px) 50vw, 25vw'
              : '(max-width: 768px) 100vw, 50vw'
          }
        />

        {/* FOMO pill — top left */}
        {(isTrending || isSoldOut) && (
          <div
            className={[
              'absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide backdrop-blur-md',
              isSoldOut
                ? 'bg-black/70 text-zinc-400'
                : 'bg-amber-400 text-zinc-900',
            ].join(' ')}
          >
            {isSoldOut ? 'Sold Out' : 'Trending'}
          </div>
        )}

        {/* Like button — top right */}
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
            className="absolute top-3 right-3 p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-colors text-white"
          >
            <Heart
              className="w-4 h-4"
              fill={isLiked ? '#EF4444' : 'none'}
              stroke={isLiked ? '#EF4444' : 'currentColor'}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Bottom: Content area — always white, always readable */}
      <div className="flex flex-col flex-1 p-5 md:p-6">
        {/* Date kicker */}
        <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">
          {dateKicker}
        </p>

        {/* Title — capitalize normalises lowercase organiser input */}
        <h3 className="text-xl font-extrabold text-zinc-900 leading-tight mb-2 line-clamp-2 capitalize group-hover:text-violet-600 transition-colors">
          {event.name}
        </h3>

        {/* Venue */}
        <div className="flex items-center text-sm text-zinc-500 mb-4">
          <MapPin className="w-4 h-4 mr-1.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1 capitalize">{event.venue}</span>
        </div>

        {/* Footer: price + sold% */}
        <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
          {lowestPrice === 0 ? (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-sm rounded-full">
              Free
            </span>
          ) : (
            <span className="text-lg font-bold text-zinc-900">
              {formatNaira(lowestPrice)}
            </span>
          )}

          {soldPct > 0 && (
            <span className="text-xs text-zinc-400 shrink-0">
              {Math.round(soldPct * 100)}% sold
            </span>
          )}
        </div>

        {/* Capacity bar — only visible when tickets are selling */}
        {soldPct > 0 && (
          <div className="mt-3 h-0.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all duration-300"
              style={{ width: `${Math.min(soldPct * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    </article>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
      >
        {content}
      </Link>
    )
  }

  return content
}
