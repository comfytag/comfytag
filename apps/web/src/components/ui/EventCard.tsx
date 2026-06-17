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

  const dateKicker = `${formatDate(event.date)} · ${formatTime(event.startTime)}`
  const overline = event.category ? `${event.category} · ${dateKicker}` : dateKicker

  const content = (
    <article
      className="group flex flex-col bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full"
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
      {/* Image area */}
      <div className="relative w-full aspect-4/3 sm:aspect-video overflow-hidden bg-zinc-100">
        <Image
          src={imageSrc}
          alt={event.name}
          fill
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          sizes={
            compact
              ? '(max-width: 768px) 50vw, 25vw'
              : '(max-width: 768px) 100vw, 50vw'
          }
        />

        {/* Sold-out overlay pill */}
        {isSoldOut && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide backdrop-blur-md bg-black/70 text-zinc-300">
            Sold Out
          </div>
        )}

        {/* Like button */}
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
            className="absolute top-3 right-3 p-2.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-md transition-colors"
          >
            <Heart
              className="w-4 h-4"
              fill={isLiked ? '#EF4444' : 'none'}
              stroke={isLiked ? '#EF4444' : '#a1a1aa'}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="p-5 flex flex-col flex-1">
        {/* Date + Category overline */}
        <p className="text-[10px] font-mono uppercase tracking-widest text-orange-600 font-bold">
          {overline}
        </p>

        {/* Title */}
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 line-clamp-1 mt-1.5">
          {event.name}
        </h3>

        {/* Venue row */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <MapPin
            className="w-3.5 h-3.5 shrink-0 text-zinc-400"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-zinc-500 truncate capitalize">{event.venue}</span>
        </div>

        {/* Footer — price + status pill */}
        <div className="mt-auto border-t border-zinc-100 pt-3 flex items-center justify-between gap-2">
          {/* Price block */}
          {lowestPrice === 0 ? (
            <span className="text-sm font-bold text-emerald-600">Free</span>
          ) : (
            <div className="flex items-baseline gap-0.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">from</span>
              <span className="text-sm font-bold text-zinc-900 ml-1">{formatNaira(lowestPrice)}</span>
            </div>
          )}

          {/* Status pill */}
          {isSoldOut ? (
            <span className="px-2.5 py-1 bg-zinc-100 text-zinc-400 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
              Sold Out
            </span>
          ) : isTrending ? (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
              Selling Fast
            </span>
          ) : soldPct > 0 ? (
            <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
              {Math.round(soldPct * 100)}% sold
            </span>
          ) : null}
        </div>
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
