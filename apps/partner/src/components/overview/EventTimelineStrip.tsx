'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@comfytag/types'
import { formatDate, formatTime } from '@comfytag/utils'

interface EventTimelineStripProps {
  events: Event[]
}

function isLiveNow(event: Event): boolean {
  if (event.status !== 'published') return false
  const eventDay = new Date(event.date).toDateString()
  return eventDay === new Date().toDateString()
}

function getCapacity(event: Event): number {
  return event.ticketType.reduce((sum, t) => sum + t.capacity, 0)
}

function getSoldPct(event: Event): number {
  const cap = getCapacity(event)
  return cap > 0 ? Math.min((event.sold / cap) * 100, 100) : 0
}

export function EventTimelineStrip({ events }: EventTimelineStripProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-400"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="text-sm text-zinc-500">No events yet.</p>
        <Link
          href="/events/create"
          className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          Create your first event →
        </Link>
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => {
    const aLive = isLiveNow(a) ? 1 : 0
    const bLive = isLiveNow(b) ? 1 : 0
    if (aLive !== bLive) return bLive - aLive
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  return (
    <div className="space-y-2.5">
      {sorted.map((event) => {
        const live = isLiveNow(event)
        const imageSrc = event.coverImage ?? event.images?.[0] ?? '/placeholder.svg'
        const soldPct = getSoldPct(event)
        const cap = getCapacity(event)

        return (
          <div
            key={event._id}
            className={[
              'group flex items-center gap-4 rounded-xl border transition-colors duration-200',
              live
                ? 'bg-white border-red-200 p-3'
                : 'bg-white border-zinc-200 p-3 hover:border-zinc-300',
            ].join(' ')}
          >
            {/* Live beacon */}
            {live && (
              <div className="shrink-0 self-start mt-1" aria-label="Live event">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-red-500" />
                </span>
              </div>
            )}

            {/* Poster thumbnail */}
            <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100">
              <Image
                src={imageSrc}
                alt={event.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>

            {/* Event metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {live && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black text-red-600 bg-red-50 border border-red-200 uppercase tracking-widest shrink-0">
                    Live
                  </span>
                )}
                {event.status === 'draft' && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold text-zinc-400 bg-zinc-100 uppercase tracking-wider shrink-0">
                    Draft
                  </span>
                )}
              </div>

              <p className="text-sm font-bold text-zinc-900 truncate leading-tight mb-1">
                {event.name}
              </p>

              <p className="text-xs text-zinc-500 truncate">
                {formatDate(event.date)} · {formatTime(event.startTime)} · {event.venue}
              </p>

              {/* Capacity micro-bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-0.5 rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-700"
                    style={{ width: `${soldPct}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 font-medium shrink-0 tabular-nums">
                  {event.sold}{cap > 0 ? `/${cap}` : ''} sold
                </span>
              </div>
            </div>

            {/* Drill-down CTA */}
            <Link
              href={`/events/${event._id}`}
              aria-label={`Open ${event.name}`}
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 text-zinc-400 hover:bg-violet-600 hover:text-white border border-zinc-200 hover:border-violet-500 transition-all duration-200"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
