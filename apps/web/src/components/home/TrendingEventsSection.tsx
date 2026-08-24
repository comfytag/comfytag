'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import type { Event } from '@comfytag/types'
import { formatNaira, formatDate } from '@comfytag/utils'

interface TrendingCard {
  id: string
  slug: string
  category: string
  title: string
  venue: string
  dateLabel: string
  image: string
  price: string
}

function mapEventToTrendingCard(event: Event): TrendingCard {
  const lowestPrice = event.ticketType.length > 0 ? Math.min(...event.ticketType.map((t) => t.price)) : 0
  return {
    id: event._id,
    slug: event.slug || event._id,
    category: event.category,
    title: event.name,
    venue: [event.venue, event.state].filter(Boolean).join(', '),
    dateLabel: `${formatDate(event.date)}${event.startTime ? ` · ${event.startTime}` : ''}`,
    image: event.coverImage ?? event.images?.[0] ?? '',
    price: lowestPrice > 0 ? formatNaira(lowestPrice) : 'Free',
  }
}

function TrendingCardTile({ card }: { card: TrendingCard }) {
  return (
    <Link
      href={`/events/${card.slug}`}
      className="group bg-(--color-surface) rounded-2xl overflow-hidden border border-(--color-border) hover:border-brand/30 transition-colors shrink-0 w-[70vw] sm:w-auto"
    >
      <div className="h-40 sm:h-48 relative overflow-hidden">
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes="(max-width: 768px) 70vw, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 px-3 py-1 bg-(--color-surface) rounded-full text-brand font-bold text-xs">
          {card.price}
        </div>
      </div>
      <div className="p-5">
        <p className="text-brand font-bold text-xs mb-2 uppercase tracking-wide truncate">{card.category}</p>
        <h4 className="text-base font-bold text-(--color-text) mb-3 line-clamp-2 capitalize group-hover:text-brand transition-colors">
          {card.title}
        </h4>
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-(--color-text-muted) text-xs">
            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{card.dateLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-(--color-text-muted) text-xs">
            <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{card.venue}</span>
          </div>
        </div>
        <span className="block w-full text-center py-3 bg-(--color-surface-2) text-(--color-text) font-bold rounded-xl group-hover:bg-brand group-hover:text-white transition-colors text-sm">
          View Details
        </span>
      </div>
    </Link>
  )
}

export function TrendingEventsSection({ events }: { events?: Event[] }) {
  if (!events || events.length === 0) return null

  const grid = events.slice(0, 8).map(mapEventToTrendingCard)
  const rail = events.slice(0, 6).map(mapEventToTrendingCard)
  const nearby = events.slice(0, 3).map(mapEventToTrendingCard)

  return (
    <section className="w-full py-16 md:py-20 bg-(--color-surface)" aria-labelledby="trending-heading">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="mb-8 md:mb-12">
          <h2 id="trending-heading" className="text-2xl md:text-3xl font-bold text-(--color-text)">
            Trending Near You
          </h2>
          <p className="text-(--color-text-muted) mt-1">Popular events in your local community</p>
        </div>

        {/* Desktop: 4-col grid */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {grid.map((card) => (
            <TrendingCardTile key={card.id} card={card} />
          ))}
        </div>

        {/* Mobile: horizontal rail */}
        <div className="sm:hidden flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {rail.map((card) => (
            <div key={card.id} className="snap-center">
              <TrendingCardTile card={card} />
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-16 flex justify-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-10 py-4 bg-(--color-surface) border-2 border-brand/20 text-brand rounded-2xl font-bold hover:bg-(--color-brand-alpha-4) transition-colors"
          >
            Load More Events
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Mobile-only: Nearby Events bento (1 large + 2 small) — matches the mobile app's home screen */}
      {nearby.length >= 3 && (
        <div className="sm:hidden max-w-7xl mx-auto px-4 mt-16">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-(--color-text)">Nearby Events</h3>
            <p className="text-(--color-text-muted) mt-1 text-sm">Happening close to you</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Link
              href={`/events/${nearby[0].slug}`}
              className="group relative h-64 rounded-2xl overflow-hidden"
            >
              <Image
                src={nearby[0].image}
                alt={nearby[0].title}
                fill
                sizes="100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                <h4 className="text-white text-lg font-bold capitalize">{nearby[0].title}</h4>
                <p className="text-white/80 text-sm mb-3 truncate">{nearby[0].venue}</p>
                <span className="w-fit px-3 py-1 rounded-full bg-brand text-white text-xs font-bold">{nearby[0].price}</span>
              </div>
            </Link>
            {[nearby[1], nearby[2]].map((card) => (
              <Link
                key={card.id}
                href={`/events/${card.slug}`}
                className="flex gap-4 bg-(--color-surface) rounded-2xl p-4 border border-(--color-border) active:bg-(--color-surface-2) transition-colors"
              >
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <Image src={card.image} alt={card.title} fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-(--color-text) leading-tight capitalize truncate">{card.title}</h4>
                  <p className="text-(--color-text-muted) text-xs mt-1 truncate">{card.dateLabel}</p>
                  <p className="text-brand text-xs font-bold mt-1">{card.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
