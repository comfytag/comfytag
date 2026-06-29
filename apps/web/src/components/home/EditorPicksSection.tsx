import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Flame, Zap, TrendingUp } from 'lucide-react'
import type { Event } from '@comfytag/types'
import { formatNaira, isToday, formatTime } from '@comfytag/utils'

interface PickEvent {
  id: string
  title: string
  venue: string
  date: string
  price: string
  image: string
  badge: 'Selling Fast' | 'Tonight' | 'Trending' | null
}


const BADGE_CONFIG = {
  'Selling Fast': { icon: Flame,      iconClass: 'text-orange-500' },
  'Tonight':      { icon: Zap,        iconClass: 'text-yellow-500' },
  'Trending':     { icon: TrendingUp, iconClass: 'text-violet-600' },
} as const

function mapEventToPick(event: Event): PickEvent {
  const tiers = event.ticketType ?? []
  const lowestPrice = tiers.length > 0 ? Math.min(...tiers.map((t) => t.price)) : 0

  const totalCapacity = tiers.reduce((sum, t) => sum + t.capacity, 0)
  const totalSold     = tiers.reduce((sum, t) => sum + t.sold, 0)
  const soldPct       = totalCapacity > 0 ? totalSold / totalCapacity : 0

  let badge: PickEvent['badge'] = null
  if (isToday(event.date))   badge = 'Tonight'
  else if (soldPct >= 0.75)  badge = 'Selling Fast'
  else if (event.featured)   badge = 'Trending'

  const dateLabel = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeLabel = event.startTime ? ` · ${formatTime(event.startTime)}` : ''

  return {
    id:    event.slug || event._id,
    title: event.name,
    venue: event.venue + (event.state ? `, ${event.state}` : ''),
    date:  `${dateLabel}${timeLabel}`,
    price: lowestPrice > 0 ? formatNaira(lowestPrice) : 'Free',
    image: event.coverImage ?? event.images?.[0] ?? '',
    badge,
  }
}

function EditorPickCard({ event, priority }: { event: PickEvent; priority: boolean }) {
  const badge = event.badge ? BADGE_CONFIG[event.badge] : null
  const BadgeIcon = badge?.icon

  return (
    <Link
      href={`/events/${event.id}`}
      className="relative shrink-0 w-[85vw] md:w-100 aspect-4/5 rounded-[2rem] overflow-hidden snap-center group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
      aria-label={`${event.title} — ${event.date} — from ${event.price}`}
    >
      {/* Cover image */}
      <Image
        src={event.image}
        alt={event.title}
        fill
        sizes="(max-width: 768px) 85vw, 400px"
        priority={priority}
        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-linear-to-t from-zinc-900/90 via-zinc-900/20 to-transparent"
        aria-hidden
      />

      {/* Urgency badge — top-left */}
      {event.badge && badge && BadgeIcon && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-zinc-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <BadgeIcon className={`h-3 w-3 ${badge.iconClass}`} aria-hidden />
          {event.badge}
        </div>
      )}

      {/* Content — pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <p className="text-zinc-300 text-sm mb-1">{event.date}</p>
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 capitalize">{event.title}</h3>
        <p className="text-zinc-400 text-sm mb-4">{event.venue}</p>

        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-lg">{event.price}</span>
          <div className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition-colors">
            Get Tickets
          </div>
        </div>
      </div>
    </Link>
  )
}

export function EditorPicksSection({ events }: { events?: Event[] }) {
  if (!events || events.length === 0) return null

  const picks = events.map(mapEventToPick)

  return (
    <section
      className="w-full py-16 md:py-24 bg-zinc-50"
      aria-labelledby="editor-picks-heading"
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-10 md:mb-14 flex items-end justify-between">
        <div>
          <p className="text-sm font-bold tracking-widest text-violet-600 uppercase mb-2">
            Exclusively Curated
          </p>
          <h2
            id="editor-picks-heading"
            className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900"
          >
            Editor&apos;s Picks
          </h2>
        </div>

        <Link
          href="/events"
          className="hidden md:flex items-center text-violet-600 font-semibold hover:text-violet-700 transition-colors"
        >
          See All
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
      </div>

      {/* Horizontal scroll rail */}
      <div className="flex overflow-x-auto gap-4 md:gap-6 px-4 md:px-8 pb-10 snap-x snap-mandatory scrollbar-hide max-w-7xl mx-auto">
        {picks.map((event, i) => (
          <EditorPickCard key={event.id} event={event} priority={i === 0} />
        ))}
      </div>
    </section>
  )
}
