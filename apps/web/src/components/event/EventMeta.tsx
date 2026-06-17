'use client'

import React from 'react'
import { CalendarIcon, MapPinIcon, HeartIcon } from '@/components/events/EventIcons'
import { formatDate, formatTime } from '@comfytag/utils'
import type { Event } from '@comfytag/types'

interface EventMetaProps {
  event: Event
  isLiked: boolean
  likeCount: number | undefined
  onLike: () => void
}

export function EventMeta({ event, isLiked, likeCount, onLike }: EventMetaProps) {
  return (
    <div>
      <h1 className="text-[26px] font-bold tracking-tight text-zinc-900 leading-tight mb-4">
        {event.name}
      </h1>

      {/* Date row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-orange-50 text-orange-600 rounded-full shrink-0">
          <CalendarIcon />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
          {formatDate(event.date)} · {formatTime(event.startTime)}
          {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
        </span>
      </div>

      {/* Venue row */}
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 bg-violet-50 text-violet-600 rounded-full shrink-0 mt-0.5">
          <MapPinIcon />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold leading-relaxed">
          {event.venue}
          {event.address ? `, ${event.address}` : ''}
          {event.state ? `, ${event.state}` : ''}
        </span>
      </div>

      {/* Like + category */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={isLiked}
          aria-label={isLiked ? 'Unlike event' : 'Like event'}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-semibold transition-all duration-150 ${
            isLiked
              ? 'border-red-300 bg-red-50 text-red-500'
              : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
          }`}
        >
          <HeartIcon filled={isLiked} />
          {(likeCount ?? 0) > 0 && <span>{(likeCount ?? 0).toLocaleString()}</span>}
        </button>

        {event.category && (
          <span className="px-3.5 py-1.5 rounded-full bg-violet-50 text-violet-700 text-sm font-semibold">
            {event.category}
          </span>
        )}
      </div>

      {/* Attendance */}
      <div className="mb-2">
        {event.sold > 0 ? (
          <p className="text-sm font-semibold text-violet-600 m-0">
            {event.sold.toLocaleString()} people going
          </p>
        ) : (
          <p className="text-sm text-zinc-400 m-0">Be the first!</p>
        )}
      </div>
    </div>
  )
}
