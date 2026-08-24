'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@comfytag/types'

const STORY_GRADIENT = 'linear-gradient(135deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5)'

function eventImage(event: Event): string | undefined {
  return event.images[0] ?? event.coverImage
}

function getSoldPct(event: Event): number {
  const totalCap = event.ticketType.reduce((s, t) => s + t.capacity, 0)
  return totalCap > 0 ? event.sold / totalCap : 0
}

// Weighted random pick without replacement — events selling faster are more
// likely to land in the reel, but it's never the same static top-N list.
// A weight floor keeps zero-sales events from being permanently excluded.
// Ported 1:1 from apps/mobile/src/screens/attendee/discover/HomeScreen.tsx.
function weightedSample<T>(items: T[], weightOf: (item: T) => number, count: number): T[] {
  const pool = items.map((item) => ({ item, weight: Math.max(weightOf(item), 0.01) }))
  const picked: T[] = []
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0)
    let r = Math.random() * total
    let idx = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight
      if (r <= 0) {
        idx = i
        break
      }
    }
    picked.push(pool[idx].item)
    pool.splice(idx, 1)
  }
  return picked
}

export function StoryReel({ events }: { events: Event[] }) {
  // Recomputed only when the event list itself changes, not on every
  // re-render, so it doesn't reshuffle under the user.
  const storyEvents = useMemo(() => weightedSample(events, getSoldPct, 10), [events])

  if (storyEvents.length === 0) return null

  return (
    <div className="md:hidden flex gap-4 overflow-x-auto pb-4 pl-4 pr-2 scrollbar-hide" aria-label="Event stories">
      {storyEvents.map((event) => (
        <Link
          key={event._id}
          href={`/events/${event.slug}`}
          className="flex flex-col items-center gap-1.5 w-[68px] shrink-0"
        >
          <div
            className="w-[66px] h-[66px] rounded-full flex items-center justify-center p-[2.5px] shrink-0"
            style={{ background: STORY_GRADIENT }}
          >
            <div className="w-full h-full rounded-full p-[2px] flex items-center justify-center bg-(--color-bg)">
              {eventImage(event) ? (
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image src={eventImage(event) as string} alt="" fill sizes="66px" className="object-cover" />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-brand" aria-hidden="true" />
              )}
            </div>
          </div>
          <span className="text-xs font-semibold text-(--color-text-muted) capitalize truncate w-full text-center">
            {event.name}
          </span>
        </Link>
      ))}
    </div>
  )
}
