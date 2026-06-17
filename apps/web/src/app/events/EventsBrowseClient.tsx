'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchX, ChevronDown, Check, Flame } from 'lucide-react'
import { EventCard } from '@/components/ui/EventCard'
import { MapView } from '@/components/search/MapView'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { LoadingSpinner, Skeleton } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { formatDate, formatTime, formatNaira } from '@comfytag/utils'
import { api } from '@/lib/api'

export interface EventsBrowseClientProps {
  initialEvents: Event[]
  eventTypes: string[]
  states: string[]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'map'
type TimeFrame = 'upcoming' | 'past'
type SortOption = 'date-earliest' | 'date-latest' | 'price-low-to-high' | 'price-high-to-low' | 'name-a-z'

interface Filters {
  searchQuery: string
  types: string[]
  state: string
  minPrice: string
  maxPrice: string
  date: '' | 'today' | 'tomorrow' | 'weekend'
}

interface SortOptionItem {
  value: SortOption
  label: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DESKTOP_PAGE_SIZE = 12
const MOBILE_PAGE_SIZE = 8
const SKELETON_COUNT = 12
const QUICK_TYPES = ['Music', 'Comedy', 'Tech', 'Sports', 'Art']

const SORT_OPTIONS: SortOptionItem[] = [
  { value: 'date-earliest', label: 'Date: Soonest first' },
  { value: 'date-latest', label: 'Date: Latest first' },
  { value: 'price-low-to-high', label: 'Price: Low to high' },
  { value: 'price-high-to-low', label: 'Price: High to low' },
  { value: 'name-a-z', label: 'Name: A–Z' },
]

const filterBtnBase =
  'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border'
const filterBtnIdle = 'border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50'
const filterBtnActive = 'border-violet-400 text-violet-700 bg-violet-50 hover:bg-violet-100'

// ─── Pure helpers (no hooks) ──────────────────────────────────────────────────

function getMinPrice(event: Event): number {
  if (event.ticketType.length === 0) return 0
  return Math.min(...event.ticketType.map((t) => t.price))
}

function isLowTickets(event: Event): boolean {
  const totalCapacity = event.ticketType.reduce((sum, t) => sum + (t.capacity ?? 0), 0)
  const totalSold = event.ticketType.reduce((sum, t) => sum + (t.sold ?? 0), 0)
  return totalCapacity > 0 && totalSold / totalCapacity > 0.75
}

function isTrending(event: Event): boolean {
  const totalCapacity = event.ticketType.reduce((sum, t) => sum + (t.capacity ?? 0), 0)
  const totalSold = event.ticketType.reduce((sum, t) => sum + (t.sold ?? 0), 0)
  return (totalCapacity > 0 && totalSold / totalCapacity >= 0.5) || event.sold >= 50
}

// ─── Skeleton placeholders ────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
      <Skeleton height="240px" borderRadius="16px" />
    </div>
  )
}

function MobileEventRowSkeleton() {
  return (
    <div className="flex bg-white rounded-2xl border border-zinc-100 p-3 gap-3 items-center">
      <div className="w-24 h-24 rounded-xl bg-zinc-100 animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="h-2.5 w-20 bg-zinc-100 animate-pulse rounded" />
        <div className="h-4 w-full bg-zinc-100 animate-pulse rounded" />
        <div className="h-3 w-3/4 bg-zinc-100 animate-pulse rounded" />
        <div className="h-5 w-14 bg-zinc-100 animate-pulse rounded-full" />
      </div>
    </div>
  )
}

// ─── FeaturedCarousel ─────────────────────────────────────────────────────────

function FeaturedCarousel({ events }: { events: Event[] }) {
  if (events.length === 0) return null
  return (
    <section className="mb-8" aria-label="Featured Experiences">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          ✦ Featured Experiences
        </h2>
        <span className="text-[11px] font-semibold bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full">
          {events.length} curated
        </span>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-3 scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-1 px-1">
        {events.map((event) => (
          <div
            key={event._id}
            className="shrink-0 w-[260px] snap-start rounded-2xl ring-1 ring-violet-400/50 shadow-sm shadow-violet-100/40 overflow-hidden"
          >
            <EventCard event={event} href={`/events/${event.slug ?? event._id}`} />
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── TrendingCarousel ─────────────────────────────────────────────────────────

function TrendingCarousel({ events }: { events: Event[] }) {
  if (events.length === 0) return null
  return (
    <section className="mb-8" aria-label="Trending Near You">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Flame className="h-5 w-5 text-amber-500" aria-hidden="true" />
          Trending Near You
        </h2>
        <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full animate-pulse">
          Selling Fast
        </span>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-3 scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-1 px-1">
        {events.map((event) => (
          <div key={event._id} className="shrink-0 w-[260px] snap-start relative rounded-2xl overflow-hidden">
            <span className="absolute top-3 left-3 z-10 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm animate-pulse">
              Low Tickets
            </span>
            <EventCard event={event} href={`/events/${event.slug ?? event._id}`} />
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── MobileEventRow ───────────────────────────────────────────────────────────

interface MobileEventRowProps {
  event: Event
  href: string
  showLowTickets: boolean
}

function MobileEventRow({ event, href, showLowTickets }: MobileEventRowProps) {
  const imageSrc = event.coverImage ?? event.images[0] ?? '/placeholder.svg'
  const lowestPrice = event.ticketType.length > 0
    ? Math.min(...event.ticketType.map((t) => t.price))
    : 0
  const dateKicker = `${formatDate(event.date)} • ${formatTime(event.startTime)}`

  return (
    <Link
      href={href}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
    >
      <div className="flex bg-white rounded-2xl overflow-hidden border border-zinc-200 p-3 gap-3 items-center hover:shadow-md transition-shadow active:scale-[0.99]">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-zinc-100">
          <Image
            src={imageSrc}
            alt={event.name}
            fill
            className="object-cover"
            sizes="96px"
          />
          {showLowTickets && (
            <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">
              Low
            </span>
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-0.5 truncate">
            {dateKicker}
          </p>
          <h3 className="text-sm font-bold text-zinc-900 leading-tight line-clamp-2 capitalize mb-1">
            {event.name}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-1 capitalize mb-2">
            {event.venue}
          </p>
          {lowestPrice === 0 ? (
            <span className="self-start px-2.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">
              Free
            </span>
          ) : (
            <span className="text-sm font-bold text-zinc-900">
              {formatNaira(lowestPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── SortDropdown ─────────────────────────────────────────────────────────────

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const activeLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sort'

  useEffect(() => {
    if (!isOpen) return
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`${filterBtnBase} ${filterBtnIdle}`}
        aria-expanded={isOpen}
      >
        <span>{activeLabel}</span>
        <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '220px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            overflow: 'hidden',
          }}
          role="listbox"
          aria-label="Sort options"
        >
          {SORT_OPTIONS.map((option, i) => {
            const isActive = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  background: isActive ? 'var(--color-surface-2)' : 'transparent',
                  border: 'none',
                  borderBottom: i < SORT_OPTIONS.length - 1 ? '1px solid var(--color-border)' : 'none',
                  color: isActive ? 'var(--color-brand)' : 'var(--color-text)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 100ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-2)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                }}
                role="option"
                aria-selected={isActive}
              >
                <span>{option.label}</span>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── StateFilterDropdown ──────────────────────────────────────────────────────

interface StateFilterDropdownProps {
  value: string
  states: string[]
  onChange: (state: string) => void
}

function StateFilterDropdown({ value, states, onChange }: StateFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredStates = searchInput.trim()
    ? states.filter((s) => s.toLowerCase().includes(searchInput.toLowerCase()))
    : states

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${filterBtnBase} w-full justify-between ${value ? filterBtnActive : filterBtnIdle}`}
        aria-expanded={isOpen}
      >
        <span>{value || 'State'}</span>
        <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            minWidth: '180px',
            maxHeight: '280px',
            overflowY: 'auto',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
          }}
          role="listbox"
          aria-label="State options"
        >
          <input
            type="text"
            placeholder="Search states..."
            aria-label="Search states"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: '13px',
              color: 'var(--color-text)',
              boxSizing: 'border-box',
              outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.borderBottomColor = 'var(--color-brand)')}
            onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'var(--color-border)')}
          />

          <button
            type="button"
            onClick={() => { onChange(''); setIsOpen(false); setSearchInput('') }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 12px',
              background: value === '' ? 'var(--color-surface-2)' : 'none',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              color: value === '' ? 'var(--color-brand)' : 'var(--color-text)',
              fontSize: '13px',
              fontWeight: value === '' ? 600 : 500,
              textAlign: 'left',
              cursor: 'pointer',
            }}
            role="option"
            aria-selected={value === ''}
          >
            <span>All states</span>
            {value === '' && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>

          {filteredStates.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => { onChange(state); setIsOpen(false); setSearchInput('') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                background: value === state ? 'var(--color-surface-2)' : 'none',
                border: 'none',
                borderBottom: '1px solid var(--color-border)',
                color: value === state ? 'var(--color-brand)' : 'var(--color-text)',
                fontSize: '13px',
                fontWeight: value === state ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 100ms ease',
              }}
              onMouseEnter={(e) => {
                if (value !== state) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-2)'
              }}
              onMouseLeave={(e) => {
                if (value !== state) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              }}
              role="option"
              aria-selected={value === state}
            >
              <span>{state}</span>
              {value === state && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}

          {filteredStates.length === 0 && (
            <div style={{ padding: '10px 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No states found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PriceDropdown ────────────────────────────────────────────────────────────

interface PricePreset {
  label: string
  minPrice: string
  maxPrice: string
  requiresFree?: boolean
  requiresPaid?: boolean
}

interface PriceDropdownProps {
  minPrice: string
  maxPrice: string
  hasFreeEvents: boolean
  hasPaidEvents: boolean
  onChange: (minPrice: string, maxPrice: string) => void
}

function PriceDropdown({ minPrice, maxPrice, hasFreeEvents, hasPaidEvents, onChange }: PriceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const allPresets: PricePreset[] = [
    { label: 'Any price', minPrice: '', maxPrice: '' },
    { label: 'Free', minPrice: '0', maxPrice: '0', requiresFree: true },
    { label: 'Under ₦5,000', minPrice: '', maxPrice: '5000', requiresPaid: true },
    { label: '₦5k – ₦20k', minPrice: '5000', maxPrice: '20000', requiresPaid: true },
    { label: '₦20k+', minPrice: '20000', maxPrice: '', requiresPaid: true },
  ]

  const presets = allPresets.filter((p) => {
    if (p.requiresFree && !hasFreeEvents) return false
    if (p.requiresPaid && !hasPaidEvents) return false
    return true
  })

  const activePreset = presets.find((p) => p.minPrice === minPrice && p.maxPrice === maxPrice)
  const hasActivePrice = !!(activePreset && activePreset.label !== 'Any price')

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${filterBtnBase} w-full justify-between ${hasActivePrice ? filterBtnActive : filterBtnIdle}`}
        aria-expanded={isOpen}
      >
        <span>{hasActivePrice ? activePreset!.label : 'Price'}</span>
        <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            minWidth: '180px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            overflow: 'hidden',
          }}
          role="listbox"
          aria-label="Price range options"
        >
          {presets.map((preset, i) => {
            const isActive = activePreset?.label === preset.label
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => { onChange(preset.minPrice, preset.maxPrice); setIsOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  background: isActive ? 'var(--color-surface-2)' : 'none',
                  border: 'none',
                  borderBottom: i < presets.length - 1 ? '1px solid var(--color-border)' : 'none',
                  color: isActive ? 'var(--color-brand)' : 'var(--color-text)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 100ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-2)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                }}
                role="option"
                aria-selected={isActive}
              >
                <span>{preset.label}</span>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EventsBrowseClient({
  initialEvents,
  eventTypes,
}: EventsBrowseClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialEvents.length === 12)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('upcoming')
  const [sortOption, setSortOption] = useState<SortOption>('date-earliest')
  const [filters, setFilters] = useState<Filters>({
    searchQuery: searchParams.get('q') ?? '',
    types: searchParams.get('category') ? [searchParams.get('category')!] : [],
    state: searchParams.get('state') ?? '',
    minPrice: '',
    maxPrice: '',
    date: (searchParams.get('date') as Filters['date']) ?? '',
  })
  const [dateMenuOpen, setDateMenuOpen] = useState(false)
  const dateRef = useRef<HTMLDivElement>(null)

  // ─── Pagination state ────────────────────────────────────────────────────────
  const [isMobileView, setIsMobileView] = useState(false)
  const [visibleCount, setVisibleCount] = useState(DESKTOP_PAGE_SIZE)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // Detect mobile viewport and sync visibleCount
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => {
      const mobile = mq.matches
      setIsMobileView(mobile)
      setVisibleCount(mobile ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Reset visible count when timeFrame changes
  useEffect(() => {
    setVisibleCount(isMobileView ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFrame])

  // ─── Dynamic filter options from current events ───────────────────────────

  const availableStates = useMemo(
    () => Array.from(new Set(events.map((e) => e.state).filter(Boolean))).sort() as string[],
    [events]
  )

  const hasFreeEvents = useMemo(
    () => events.some((e) => e.ticketType.length === 0 || e.ticketType.every((t) => t.price === 0)),
    [events]
  )

  const hasPaidEvents = useMemo(
    () => events.some((e) => e.ticketType.some((t) => t.price > 0)),
    [events]
  )

  // ─── API fetch ────────────────────────────────────────────────────────────

  const buildParams = useCallback((f: Filters, p: number) => {
    const params = new URLSearchParams()
    params.set('limit', '12')
    params.set('page', String(p))
    params.set('showPast', 'true')
    if (f.searchQuery.trim()) params.set('q', f.searchQuery.trim())
    if (f.types.length > 0) params.set('category', f.types.join(','))
    if (f.state) params.set('state', f.state)
    if (f.minPrice) params.set('priceMin', f.minPrice)
    if (f.maxPrice) params.set('priceMax', f.maxPrice)
    if (f.date) params.set('date', f.date)
    return params.toString()
  }, [])

  const fetchEvents = useCallback(
    async (f: Filters, p: number, append = false) => {
      const fresh = p === 1 && !append
      if (fresh) setIsLoading(true)
      else setIsLoadingMore(true)

      try {
        const needsSearch = !!f.searchQuery.trim() || !!f.date
        const endpoint = needsSearch ? '/events/search' : '/events'
        const response = await api.get(`${endpoint}?${buildParams(f, p)}`)
        const data = response.data as Record<string, unknown>
        const list: Event[] = Array.isArray(data)
          ? (data as Event[])
          : ((data?.data ?? data?.events ?? []) as Event[])

        if (fresh) setEvents(list)
        else setEvents((prev) => [...prev, ...list])

        setHasMore((data.hasMore as boolean) ?? list.length === 12)
        setPage(p)
      } catch {
        if (fresh) setEvents([])
      } finally {
        if (fresh) setIsLoading(false)
        else setIsLoadingMore(false)
      }
    },
    [buildParams]
  )

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // Reset pagination on new filter query
    setVisibleCount(isMobileView ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE)
    debounceRef.current = setTimeout(() => { void fetchEvents(filters, 1) }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function toggleType(type: string) {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type) ? [] : [type],
    }))
  }

  function toggleAll() {
    setFilters((prev) => ({ ...prev, types: [] }))
  }

  function handleClear() {
    setFilters({ searchQuery: '', types: [], state: '', minPrice: '', maxPrice: '', date: '' })
    setSortOption('date-earliest')
  }

  useEffect(() => {
    if (!dateMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dateMenuOpen])

  function handleLoadMore() {
    const chunk = isMobileView ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE
    const newCount = visibleCount + chunk
    setVisibleCount(newCount)
    // Trigger API fetch if we've exhausted locally cached events
    if (newCount > filteredEvents.length && hasMore) {
      void fetchEvents(filters, page + 1, true)
    }
  }

  function handleEventSelect(id: string) {
    const event = events.find((e) => e._id === id)
    if (event) router.push(`/events/${event.slug ?? event._id}`)
  }

  // ─── Derived state ─────────────────────────────────────────────────────────

  const now = new Date()

  const upcomingEvents = useMemo(
    () => events.filter((e) => !e.date || new Date(e.date) >= now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events]
  )

  const pastEvents = useMemo(
    () => events.filter((e) => !!e.date && new Date(e.date) < now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events]
  )

  // Curated editorial arrays — derived from all upcoming events regardless of active filters
  const featuredEvents = useMemo(
    () => upcomingEvents.filter((e) => e.featured),
    [upcomingEvents]
  )

  const trendingEvents = useMemo(
    () => upcomingEvents.filter((e) => isTrending(e)),
    [upcomingEvents]
  )

  const filteredEvents = useMemo(() => {
    const base = timeFrame === 'upcoming' ? upcomingEvents : pastEvents
    return [...base].sort((a, b) => {
      switch (sortOption) {
        case 'price-low-to-high':
          return getMinPrice(a) - getMinPrice(b)
        case 'price-high-to-low':
          return getMinPrice(b) - getMinPrice(a)
        case 'date-latest':
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        case 'name-a-z':
          return a.name.localeCompare(b.name)
        default:
          return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
      }
    })
  }, [upcomingEvents, pastEvents, timeFrame, sortOption])

  // Paginated slice for the main catalog
  const visibleEvents = useMemo(
    () => filteredEvents.slice(0, visibleCount),
    [filteredEvents, visibleCount]
  )

  const canLoadMore = visibleCount < filteredEvents.length || hasMore

  const hasActive =
    !!filters.searchQuery ||
    filters.types.length > 0 ||
    !!filters.state ||
    !!filters.minPrice ||
    !!filters.maxPrice ||
    !!filters.date

  const pillTypes = useMemo(
    () => Array.from(new Set([...QUICK_TYPES, ...eventTypes])).slice(0, 8),
    [eventTypes]
  )

  const dateLabelMap: Record<string, string> = {
    today: 'Today',
    tomorrow: 'Tomorrow',
    weekend: 'This Weekend',
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 pb-24 font-sans pt-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">

        {/* ── Page Header ── */}
        <div className="border-b border-zinc-100 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
              Discover Experiences
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {isLoading
                ? 'Loading events…'
                : `${filteredEvents.length} events matching your vibe`}
            </p>
          </div>
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>

        {/* ── Two-Column Split ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mt-8">

          {/* ── Block A: Left Sticky Filter Rail (desktop only) ── */}
          <aside className="hidden lg:block sticky top-28 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">

            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
              Categories
            </h3>
            <nav className="flex flex-col">
              <button
                type="button"
                onClick={toggleAll}
                className={
                  filters.types.length === 0
                    ? 'w-full text-left bg-linear-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl px-4 py-2.5 mb-2 transition-all block'
                    : 'w-full text-left text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl px-4 py-2.5 mb-2 transition-colors block'
                }
              >
                All
              </button>
              {pillTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={
                    filters.types.includes(type)
                      ? 'w-full text-left bg-linear-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl px-4 py-2.5 mb-2 transition-all block'
                      : 'w-full text-left text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl px-4 py-2.5 mb-2 transition-colors block'
                  }
                >
                  {type}
                </button>
              ))}
            </nav>

            <div className="space-y-4 pt-4 border-t border-zinc-100 mt-6">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Filters
              </h3>

              {/* Date */}
              <div ref={dateRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDateMenuOpen((o) => !o)}
                  className={`${filterBtnBase} w-full justify-between ${filters.date ? filterBtnActive : filterBtnIdle}`}
                >
                  <span>{filters.date ? dateLabelMap[filters.date] : 'Date'}</span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </button>
                {dateMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 50,
                      overflow: 'hidden',
                    }}
                  >
                    {(['', 'today', 'tomorrow', 'weekend'] as const).map((val, i, arr) => {
                      const isActive = filters.date === val
                      return (
                        <button
                          key={val || 'any'}
                          type="button"
                          onClick={() => { setFilters((p) => ({ ...p, date: val })); setDateMenuOpen(false) }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 14px',
                            fontSize: '13px',
                            fontWeight: isActive ? 600 : 500,
                            background: isActive ? 'var(--color-surface-2)' : 'transparent',
                            color: isActive ? 'var(--color-brand)' : 'var(--color-text)',
                            border: 'none',
                            cursor: 'pointer',
                            borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                          }}
                        >
                          <span>{val === '' ? 'Any date' : dateLabelMap[val]}</span>
                          {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <StateFilterDropdown
                value={filters.state}
                states={availableStates}
                onChange={(state) => setFilters((prev) => ({ ...prev, state }))}
              />

              <PriceDropdown
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                hasFreeEvents={hasFreeEvents}
                hasPaidEvents={hasPaidEvents}
                onChange={(minPrice, maxPrice) => setFilters((prev) => ({ ...prev, minPrice, maxPrice }))}
              />

              {hasActive && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors text-left"
                >
                  Clear all filters ×
                </button>
              )}
            </div>

            {/* ── Sidebar Value Banner ── */}
            <div className="mt-8 p-5 bg-linear-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-violet-600/20 blur-2xl group-hover:bg-violet-600/30 transition-all duration-500" />
              <span className="inline-block text-[10px] font-semibold text-violet-400 border border-violet-500/40 rounded-full px-2.5 py-0.5 mb-3 tracking-wide">
                Coming Soon
              </span>
              <p className="text-sm font-bold text-white leading-snug mb-2">
                Go Biometric
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tired of hunting for QR codes? Safe, encrypted face verification passes are coming soon to the ComfyTag ecosystem.
              </p>
            </div>
          </aside>

          {/* ── Block B: Right-Hand Discovery Canvas ── */}
          <div className="lg:col-span-3">

            {/* Mobile category pill track */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-4 scrollbar-hide mb-2">
              <button
                type="button"
                onClick={toggleAll}
                className={
                  filters.types.length === 0
                    ? 'shrink-0 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors bg-zinc-900 text-white shadow-sm'
                    : 'shrink-0 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }
              >
                All
              </button>
              {pillTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={
                    filters.types.includes(type)
                      ? 'shrink-0 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors bg-zinc-900 text-white shadow-sm'
                      : 'shrink-0 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Mobile filter + sort bar */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
              {(['today', 'tomorrow', 'weekend'] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, date: p.date === val ? '' : val }))}
                  className={`shrink-0 ${filterBtnBase} ${filters.date === val ? filterBtnActive : filterBtnIdle}`}
                >
                  {dateLabelMap[val]}
                </button>
              ))}
              <div className="shrink-0 min-w-[88px]">
                <StateFilterDropdown
                  value={filters.state}
                  states={availableStates}
                  onChange={(state) => setFilters((prev) => ({ ...prev, state }))}
                />
              </div>
              <div className="shrink-0 min-w-[72px]">
                <PriceDropdown
                  minPrice={filters.minPrice}
                  maxPrice={filters.maxPrice}
                  hasFreeEvents={hasFreeEvents}
                  hasPaidEvents={hasPaidEvents}
                  onChange={(minPrice, maxPrice) => setFilters((prev) => ({ ...prev, minPrice, maxPrice }))}
                />
              </div>
              <div className="shrink-0">
                <SortDropdown value={sortOption} onChange={setSortOption} />
              </div>
              {hasActive && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-600 border border-transparent hover:border-zinc-200 transition-colors whitespace-nowrap"
                >
                  Clear ×
                </button>
              )}
            </div>

            {/* ── Block 1: Dynamic Featured Carousel ── */}
            {!isLoading && <FeaturedCarousel events={featuredEvents} />}

            {/* ── Block 2: Dynamic Trending FOMO Carousel ── */}
            {!isLoading && <TrendingCarousel events={trendingEvents} />}

            {/* ── Block 3: Main Event Catalog Track ── */}

            {/* Tab switcher + sort */}
            <div className="flex items-end justify-between mb-8">
              <div className="flex border-b border-zinc-200 w-fit gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={() => setTimeFrame('upcoming')}
                  className={
                    timeFrame === 'upcoming'
                      ? 'border-b-2 border-violet-600 pb-3 px-1 text-sm font-bold text-zinc-900 transition-all'
                      : 'border-b-2 border-transparent pb-3 px-1 text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-all'
                  }
                >
                  Upcoming Events
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFrame('past')}
                  className={
                    timeFrame === 'past'
                      ? 'border-b-2 border-violet-600 pb-3 px-1 text-sm font-bold text-zinc-900 transition-all'
                      : 'border-b-2 border-transparent pb-3 px-1 text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-all'
                  }
                >
                  Past Recaps
                </button>
              </div>

              <div className="hidden lg:block">
                <SortDropdown value={sortOption} onChange={setSortOption} />
              </div>
            </div>

            {/* Content area */}
            {isLoading ? (
              <>
                <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <EventCardSkeleton key={i} />
                  ))}
                </div>
                <div className="flex md:hidden flex-col gap-3">
                  {Array.from({ length: MOBILE_PAGE_SIZE }).map((_, i) => (
                    <MobileEventRowSkeleton key={i} />
                  ))}
                </div>
              </>

            ) : viewMode === 'map' ? (
              <div className="h-[600px] rounded-2xl overflow-hidden border border-zinc-200">
                <MapView
                  events={events}
                  onEventSelect={handleEventSelect}
                  onClose={() => setViewMode('list')}
                  selectedState={filters.state}
                />
              </div>

            ) : filteredEvents.length === 0 ? (
              timeFrame === 'upcoming' ? (
                <div className="py-16 border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
                    <SearchX className="h-7 w-7 text-zinc-400" />
                  </div>
                  <p className="text-zinc-800 font-bold text-lg mb-2">No upcoming events yet</p>
                  <p className="text-sm text-zinc-500 max-w-sm mb-6">
                    No upcoming events scheduled in this category yet. Check out the{' '}
                    <span className="font-semibold text-zinc-700">Past Recaps</span> tab to see what you missed!
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTimeFrame('past')}
                      className="text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-5 py-2.5 rounded-xl transition-colors"
                    >
                      View Past Recaps →
                    </button>
                    {hasActive && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <SearchX className="h-12 w-12 text-zinc-300 mb-4" />
                  <p className="text-zinc-700 font-semibold mb-1">No past events found</p>
                  <p className="text-sm text-zinc-400 max-w-xs mb-6">
                    {hasActive
                      ? 'Try adjusting your filters to see more results.'
                      : 'Past events will appear here once they wrap up.'}
                  </p>
                  {hasActive && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )

            ) : (
              <>
                {/* Desktop grid — capped to visibleCount */}
                <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                  {visibleEvents.map((event) => (
                    <div key={event._id} className="relative">
                      {timeFrame === 'upcoming' && isLowTickets(event) && (
                        <span className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10 shadow-sm animate-pulse">
                          Low Tickets
                        </span>
                      )}
                      <EventCard
                        event={event}
                        href={`/events/${event.slug ?? event._id}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Mobile row list — capped to visibleCount */}
                <div className="flex md:hidden flex-col gap-3 mb-6">
                  {visibleEvents.map((event) => (
                    <MobileEventRow
                      key={event._id}
                      event={event}
                      href={`/events/${event.slug ?? event._id}`}
                      showLowTickets={timeFrame === 'upcoming' && isLowTickets(event)}
                    />
                  ))}
                </div>

                {/* ── Block 4: Tactical Pagination Control ── */}
                {canLoadMore && (
                  <div className="flex justify-center mt-10 mb-4">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="mx-auto mt-0 px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isLoadingMore ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Loading more…</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Events</span>
                          <ChevronDown className="h-4 w-4 opacity-70" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* ── Escape Hatch ── */}
                <div className="mt-12 p-6 bg-white border border-zinc-200 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-left">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">Can't find your vibe?</h3>
                    <p className="text-zinc-500 text-sm mt-1">
                      Host your own live experience on ComfyTag and launch ticketing in less than 5 minutes.
                    </p>
                  </div>
                  <a
                    href="https://partner.comfytag.com"
                    className="px-6 py-3 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors text-sm whitespace-nowrap mx-auto md:mx-0"
                  >
                    Create an Event
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
