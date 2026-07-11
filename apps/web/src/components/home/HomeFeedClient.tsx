'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { SearchX, ArrowRight, Flame, Sparkles } from 'lucide-react'
import { EventCard } from '@/components/ui/EventCard'
import { isUpcoming } from '@comfytag/utils'
import type { Event, Category } from '@comfytag/types'

interface HomeFeedClientProps {
  events: Event[]
  categories: Category[]
}

// ─── Pure helpers (module-level, stable references) ───────────────────────────

function getSoldPct(event: Event): number {
  const totalCap = event.ticketType.reduce((s, t) => s + t.capacity, 0)
  return totalCap > 0 ? event.sold / totalCap : 0
}

function isNewEvent(event: Event): boolean {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return new Date(event.createdAt).getTime() >= sevenDaysAgo
}

// ─── Section A: Featured horizontal swipe track ───────────────────────────────

function FeaturedSection({ events }: { events: Event[] }) {
  if (events.length === 0) return null
  return (
    <section aria-label="Featured events" className="mb-12">
      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Featured</h2>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {events.map((event) => (
          <div key={event._id} className="w-[85vw] sm:w-[320px] shrink-0 snap-center">
            <EventCard event={event} href={`/events/${event.slug}`} />
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Section B: Trending Now with violet/amber urgency badges ─────────────────

function TrendingSection({ events }: { events: Event[] }) {
  if (events.length === 0) return null
  return (
    <section aria-label="Trending events" className="mb-12">
      <div className="flex items-center gap-2.5 mb-6">
        <Flame className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Trending Now</h2>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {events.map((event) => {
          const pctDisplay = Math.round(getSoldPct(event) * 100)
          return (
            <div key={event._id} className="relative w-[85vw] sm:w-[320px] shrink-0 snap-center">
              <EventCard event={event} href={`/events/${event.slug}`} isTrending />
              {/* Violet urgency badge with amber dot — top-right overlay on image */}
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-600 text-white text-[11px] font-bold pointer-events-none"
                aria-hidden="true"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {pctDisplay}% sold
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Section C: New Releases with "Just Dropped" badge overlay ────────────────

function NewReleasesSection({ events }: { events: Event[] }) {
  if (events.length === 0) return null
  return (
    <section aria-label="New releases" className="mb-12">
      <div className="flex items-center gap-2.5 mb-6">
        <Sparkles className="w-5 h-5 text-violet-600" aria-hidden="true" />
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">New Releases</h2>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {events.map((event) => (
          <div key={event._id} className="relative w-[85vw] sm:w-[320px] shrink-0 snap-center">
            <EventCard event={event} href={`/events/${event.slug}`} />
            {/* "Just Dropped" overlay — positioned above the card image area */}
            <div
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-violet-600 text-white text-[11px] font-bold uppercase tracking-wide pointer-events-none"
              aria-hidden="true"
            >
              Just Dropped
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function HomeFeedClient({ events, categories }: HomeFeedClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const visibleCategories = useMemo(
    () =>
      categories.filter((cat) => {
        const key = (cat.slug ?? cat.title).toLowerCase()
        return events.some(
          (e) =>
            e.status === 'published' &&
            isUpcoming(e.date) &&
            e.category.toLowerCase() === key
        )
      }),
    [events, categories]
  )

  const activeCategoryTitle = useMemo(() => {
    if (activeCategory === 'All') return 'All Events'
    const match = visibleCategories.find(
      (c) => (c.slug ?? c.title).toLowerCase() === activeCategory.toLowerCase()
    )
    return match ? match.title : activeCategory
  }, [activeCategory, visibleCategories])

  // Section A — organiser-marked featured events
  const featuredEvents = useMemo(() => events.filter((e) => e.featured), [events])

  // Section B — sold tickets ≥ 50% of total tier capacity
  const trendingEvents = useMemo(() => events.filter((e) => getSoldPct(e) >= 0.5), [events])

  // Section C — created within the last 7 days
  const newEvents = useMemo(() => events.filter((e) => isNewEvent(e)), [events])

  // Hard-cap each horizontal track at 8 so a burst of new events never blows out the swipe track
  const dynamicFeatured = featuredEvents.slice(0, 8)
  const dynamicTrending = trendingEvents.slice(0, 8)
  const dynamicNew = newEvents.slice(0, 8)

  // Section D — full filtered list (used for count badge)
  const homepageVisibleEvents = useMemo(() => {
    if (activeCategory === 'All') return events
    return events.filter(
      (e) => e.category.toLowerCase() === activeCategory.toLowerCase()
    )
  }, [events, activeCategory])

  // Section D — hard-capped at 8 for the grid
  const filteredGrid = useMemo(() => homepageVisibleEvents.slice(0, 8), [homepageVisibleEvents])

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 pb-24 font-sans" id="events-feed">
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">

      {/* ── Section A: Featured ── */}
      <FeaturedSection events={dynamicFeatured} />

      {/* ── Section B: Trending Now ── */}
      <TrendingSection events={dynamicTrending} />

      {/* ── Section C: New Releases ── */}
      <NewReleasesSection events={dynamicNew} />

      {/* ── Section D: Main Grid (max 8) ── */}
      <section aria-label="Browse events" className="mb-10">
        <div className="mt-16 mb-8 space-y-6">
          {/* Category filter pills — scoped to this grid section */}
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              className={
                activeCategory === 'All'
                  ? 'px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-colors bg-zinc-900 text-white'
                  : 'px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }
            >
              All
            </button>

            {visibleCategories.map((cat) => {
              const key = cat.slug ?? cat.title
              const isActive = activeCategory.toLowerCase() === key.toLowerCase()
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={
                    isActive
                      ? 'px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-colors bg-zinc-900 text-white'
                      : 'px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }
                >
                  {cat.title}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              {activeCategoryTitle}
            </h2>
            <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-md">
              {homepageVisibleEvents.length} Available
            </span>
          </div>
        </div>

        {filteredGrid.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <SearchX className="text-zinc-300 w-16 h-16 mb-4" aria-hidden="true" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No events found</h3>
            <p className="text-zinc-500">Check back later or try another category.</p>
          </div>
        ) : (
          <>
            {/* Mobile carousel — all 8 events, full swipe track */}
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:hidden">
              {filteredGrid.map((event) => (
                <div key={event._id} className="w-[85vw] sm:w-[320px] shrink-0 snap-center">
                  <EventCard event={event} href={`/events/${event.slug}`} />
                </div>
              ))}
            </div>

            {/* Desktop grid — 6 cards on md/lg (3-col), 8 cards on xl+ (4-col) */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 [&>*:nth-child(n+7)]:md:hidden [&>*:nth-child(n+7)]:xl:block">
              {filteredGrid.map((event) => (
                <div key={event._id}>
                  <EventCard event={event} href={`/events/${event.slug}`} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Section E: Explore CTA ── */}
      <div className="flex justify-center pt-2">
        <Link
          href="/events"
          className="inline-flex items-center justify-center bg-zinc-950 text-white font-bold text-sm px-8 py-4 rounded-xl hover:bg-zinc-800 transition-all group gap-2"
        >
          Explore All Events
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Link>
      </div>
    </div>
    </div>
  )
}
