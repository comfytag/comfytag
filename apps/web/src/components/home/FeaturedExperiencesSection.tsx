'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react'
import type { Event } from '@comfytag/types'
import { isToday, formatTime } from '@comfytag/utils'

interface FeaturedCard {
  id: string
  slug: string
  title: string
  description: string
  venue: string
  dateLabel: string
  image: string
  badge: 'Selling Fast' | 'Tonight' | 'Exclusive Access' | null
}

function mapEventToFeaturedCard(event: Event): FeaturedCard {
  const totalCapacity = event.ticketType.reduce((sum, t) => sum + t.capacity, 0)
  const totalSold = event.ticketType.reduce((sum, t) => sum + t.sold, 0)
  const soldPct = totalCapacity > 0 ? totalSold / totalCapacity : 0

  let badge: FeaturedCard['badge'] = null
  if (isToday(event.date)) badge = 'Tonight'
  else if (soldPct >= 0.75) badge = 'Selling Fast'
  else if (event.featured) badge = 'Exclusive Access'

  const dateLabel = new Date(event.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  }) + (event.startTime ? ` · ${formatTime(event.startTime)}` : '')

  return {
    id: event._id,
    slug: event.slug || event._id,
    title: event.name,
    description: event.headline ?? event.description ?? '',
    venue: [event.venue, event.state].filter(Boolean).join(', '),
    dateLabel,
    image: event.coverImage ?? event.images?.[0] ?? '',
    badge,
  }
}

function FeaturedCardTile({ card, priority }: { card: FeaturedCard; priority: boolean }) {
  return (
    <Link
      href={`/events/${card.slug}`}
      className="group relative shrink-0 w-[85vw] md:w-[600px] h-[400px] rounded-3xl overflow-hidden snap-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <Image
        src={card.image}
        alt={card.title}
        fill
        sizes="(max-width: 768px) 85vw, 600px"
        priority={priority}
        className="object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden="true" />

      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        {card.badge && (
          <span className="inline-flex w-fit mb-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-(--color-energy) text-white">
            {card.badge}
          </span>
        )}
        <h3 className="text-2xl font-bold text-white mb-2 capitalize">{card.title}</h3>
        {card.description && (
          <p className="text-white/80 text-sm mb-6 max-w-md line-clamp-2">{card.description}</p>
        )}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 gap-5 text-white/90 text-xs">
            <span className="flex shrink-0 items-center gap-1.5">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              {card.dateLabel}
            </span>
            <span className="flex items-center gap-1.5 min-w-0 truncate">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
              {card.venue}
            </span>
          </div>
          <span className="shrink-0 w-full md:w-auto text-center px-5 py-2.5 bg-white text-brand font-bold rounded-lg text-sm group-hover:bg-(--color-brand-light) transition-colors">
            Get Ticket
          </span>
        </div>
      </div>
    </Link>
  )
}

export function FeaturedExperiencesSection({ events }: { events?: Event[] }) {
  const railRef = useRef<HTMLDivElement>(null)

  if (!events || events.length === 0) return null

  const cards = events.map(mapEventToFeaturedCard)

  function scrollByCard(dir: 1 | -1) {
    railRef.current?.scrollBy({ left: dir * 620, behavior: 'smooth' })
  }

  return (
    <section className="w-full py-16 md:py-20" aria-labelledby="featured-experiences-heading">
      <div className="max-w-7xl mx-auto px-4 md:px-10 mb-8 flex justify-between items-end">
        <div>
          <h2 id="featured-experiences-heading" className="text-2xl md:text-3xl font-bold text-(--color-text)">
            Featured Experiences
          </h2>
          <p className="text-(--color-text-muted) mt-1">Hand-picked events for your style</p>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Scroll left"
            className="w-12 h-12 rounded-full border border-(--color-border) flex items-center justify-center hover:bg-(--color-surface-2) transition-colors"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Scroll right"
            className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-dark transition-colors"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="flex gap-6 overflow-x-auto pb-4 px-4 md:px-10 snap-x snap-mandatory scrollbar-hide max-w-7xl mx-auto"
      >
        {cards.map((card, i) => (
          <FeaturedCardTile key={card.id} card={card} priority={i === 0} />
        ))}
      </div>
    </section>
  )
}
