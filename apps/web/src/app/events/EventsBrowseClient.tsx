'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { SearchX, ChevronDown, Check, Calendar, MapPin, MapPinned, SlidersHorizontal, X } from 'lucide-react'
import { LoadingSpinner, Skeleton } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { formatDate, formatTime, formatNaira } from '@comfytag/utils'
import { api } from '@/lib/api'

export interface EventsBrowseClientProps {
  initialUpcoming: Event[]
  initialPast: Event[]
  eventTypes: string[]
  states: string[]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeFrame = 'upcoming' | 'past'
type SortOption = 'newest' | 'price-low-to-high' | 'price-high-to-low' | 'popularity'

interface Filters {
  searchQuery: string
  types: string[]
  state: string
  minPrice: string
  maxPrice: string
  dateFrom: string
  dateTo: string
}

const EMPTY_FILTERS: Filters = {
  searchQuery: '',
  types: [],
  state: '',
  minPrice: '',
  maxPrice: '',
  dateFrom: '',
  dateTo: '',
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12
const SKELETON_COUNT = 6
const QUICK_TYPES = ['Music', 'Comedy', 'Tech', 'Sports', 'Art']
const PRICE_SLIDER_MAX = 200_000
const PRICE_SLIDER_STEP = 5_000

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low-to-high', label: 'Price: Low to High' },
  { value: 'price-high-to-low', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity' },
]

const CTA_LABEL_BY_CATEGORY: Record<string, string> = {
  music: 'View Tickets',
  tech: 'Reserve Spot',
  'tech conferences': 'Reserve Spot',
  art: 'View Tickets',
  'art exhibits': 'View Tickets',
  workshop: 'Book Session',
  workshops: 'Book Session',
  social: 'Join List',
  food: 'Get Pass',
}

function ctaLabel(category: string): string {
  return CTA_LABEL_BY_CATEGORY[category.toLowerCase()] ?? 'View Tickets'
}

function getMinPrice(event: Event): number {
  if (event.ticketType.length === 0) return 0
  return Math.min(...event.ticketType.map((t) => t.price))
}

// ─── Discovery card — matches Comfytag_Designs/web_comfytag/event_discovery_attendee_web_app ──

function DiscoveryEventCard({ event }: { event: Event }) {
  const price = getMinPrice(event)
  const priceLabel = price === 0 ? 'Free' : formatNaira(price)
  const imageSrc = event.coverImage ?? event.images[0] ?? '/placeholder.svg'
  const href = `/events/${event.slug ?? event._id}`

  return (
    <article className="group bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <Link href={href} className="block relative h-48 overflow-hidden">
        <Image
          src={imageSrc}
          alt={event.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-brand capitalize">
          {event.category}
        </div>
        <div className="absolute bottom-4 right-4 bg-brand text-white px-3 py-1 rounded-lg text-sm font-semibold">
          {priceLabel}
        </div>
      </Link>
      <div className="p-5 flex flex-col gap-3">
        <Link href={href}>
          <h3 className="text-lg font-bold text-(--color-text) line-clamp-1 capitalize hover:text-brand transition-colors">
            {event.name}
          </h3>
        </Link>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-(--color-text-muted) text-sm">
            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{formatDate(event.date)}{event.startTime ? ` • ${formatTime(event.startTime)}` : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-(--color-text-muted) text-sm">
            <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>
        <Link
          href={href}
          className="mt-2 w-full py-2.5 rounded-lg border-[1.5px] border-brand text-brand text-sm font-semibold text-center hover:bg-brand hover:text-white transition-colors"
        >
          {ctaLabel(event.category)}
        </Link>
      </div>
    </article>
  )
}

function DiscoveryCardSkeleton() {
  return <Skeleton height="320px" borderRadius="12px" />
}

// ─── Per-timeframe fetch/paginate hook ─────────────────────────────────────────

function useEventSection(
  filters: Filters,
  sortOption: SortOption,
  timeFrame: TimeFrame,
  initial: Event[]
) {
  const [events, setEvents] = useState<Event[]>(initial)
  const [total, setTotal] = useState(initial.length)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const hasHydrated = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildQuery = useCallback((f: Filters, p: number) => {
    const params = new URLSearchParams()
    params.set('limit', String(PAGE_SIZE))
    params.set('page', String(p))
    if (timeFrame === 'past') params.set('showPast', 'true')
    if (f.searchQuery.trim()) params.set('q', f.searchQuery.trim())
    if (f.types.length > 0) params.set('category', f.types.join(','))
    if (f.state) params.set('state', f.state)
    if (f.minPrice) params.set('priceMin', f.minPrice)
    if (f.maxPrice) params.set('priceMax', f.maxPrice)
    if (f.dateFrom) params.set('dateFrom', f.dateFrom)
    if (f.dateTo) params.set('dateTo', f.dateTo)
    return params.toString()
  }, [timeFrame])

  const fetchPage = useCallback(
    async (f: Filters, p: number, append: boolean) => {
      if (append) setIsLoadingMore(true)
      else setIsLoading(true)

      try {
        const res = await api.get(`/events/search?${buildQuery(f, p)}`)
        const data = res.data as Record<string, unknown>
        const list = (Array.isArray(data) ? data : (data?.data ?? [])) as Event[]

        setEvents((prev) => (append ? [...prev, ...list] : list))
        setTotal((data.total as number) ?? list.length)
        setHasMore((data.hasMore as boolean) ?? list.length === PAGE_SIZE)
        setPage(p)
      } catch {
        if (!append) setEvents([])
      } finally {
        if (append) setIsLoadingMore(false)
        else setIsLoading(false)
      }
    },
    [buildQuery]
  )

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true
      if (initial.length > 0) return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { void fetchPage(filters, 1, false) }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, timeFrame])

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      switch (sortOption) {
        case 'price-low-to-high': return getMinPrice(a) - getMinPrice(b)
        case 'price-high-to-low': return getMinPrice(b) - getMinPrice(a)
        case 'popularity': return (b.sold ?? 0) - (a.sold ?? 0)
        default: return timeFrame === 'past'
          ? new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          : new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
      }
    })
  }, [events, sortOption, timeFrame])

  function loadMore() {
    void fetchPage(filters, page + 1, true)
  }

  return { events: sorted, total, isLoading, isLoadingMore, hasMore, loadMore }
}

// ─── Filter fields — shared between the desktop sidebar and the mobile modal ──

interface FilterFieldsProps {
  draft: Filters
  setDraft: React.Dispatch<React.SetStateAction<Filters>>
  states: string[]
  categories: string[]
}

function FilterFields({ draft, setDraft, states, categories }: FilterFieldsProps) {
  const sliderValue = draft.maxPrice ? Number(draft.maxPrice) : PRICE_SLIDER_MAX

  return (
    <>
        {/* Location */}
        <div className="flex flex-col gap-3">
          <label htmlFor="filter-location" className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
            Location
          </label>
          <div className="relative">
            <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted) pointer-events-none" aria-hidden="true" />
            <select
              id="filter-location"
              value={draft.state}
              onChange={(e) => setDraft((p) => ({ ...p, state: e.target.value }))}
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg py-2 pl-9 pr-4 text-sm text-(--color-text) focus:ring-2 focus:ring-brand focus:border-brand appearance-none cursor-pointer"
            >
              <option value="">All Cities</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
            Date Range
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="date"
              aria-label="From date"
              value={draft.dateFrom}
              onChange={(e) => setDraft((p) => ({ ...p, dateFrom: e.target.value }))}
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg py-2 px-3 text-sm text-(--color-text) focus:ring-2 focus:ring-brand focus:border-brand"
            />
            <input
              type="date"
              aria-label="To date"
              value={draft.dateTo}
              onChange={(e) => setDraft((p) => ({ ...p, dateTo: e.target.value }))}
              className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg py-2 px-3 text-sm text-(--color-text) focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label htmlFor="filter-price" className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
              Price Range
            </label>
            <span className="text-xs font-semibold text-brand">
              ₦0 – {sliderValue >= PRICE_SLIDER_MAX ? 'Any' : formatNaira(sliderValue)}
            </span>
          </div>
          <input
            id="filter-price"
            type="range"
            min={0}
            max={PRICE_SLIDER_MAX}
            step={PRICE_SLIDER_STEP}
            value={sliderValue}
            onChange={(e) => {
              const v = Number(e.target.value)
              setDraft((p) => ({ ...p, minPrice: '', maxPrice: v >= PRICE_SLIDER_MAX ? '' : String(v) }))
            }}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-brand bg-(--color-border)"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
            Categories
          </label>
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const checked = draft.types.includes(cat)
              return (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setDraft((p) => ({
                        ...p,
                        types: checked ? p.types.filter((t) => t !== cat) : [...p.types, cat],
                      }))
                    }
                    className="w-5 h-5 rounded border-(--color-border) text-brand focus:ring-brand accent-brand"
                  />
                  <span className="text-sm text-(--color-text-muted) group-hover:text-brand transition-colors capitalize">
                    {cat}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
    </>
  )
}

// ─── Filter sidebar (desktop, matches mockup) ──────────────────────────────────

interface FilterPanelProps extends FilterFieldsProps {
  onApply: () => void
  isDirty: boolean
}

function FilterSidebar(props: FilterPanelProps) {
  return (
    <aside className="hidden xl:block w-60 fixed left-0 top-[73px] bottom-0 overflow-y-auto bg-(--color-surface-2)/50 border-r border-(--color-border) p-6">
      <div className="flex flex-col gap-8">
        <h2 className="text-xl font-bold text-(--color-text)">Filters</h2>
        <FilterFields {...props} />
        <button
          type="button"
          onClick={props.onApply}
          disabled={!props.isDirty}
          className="mt-2 bg-brand text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-dark active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply Filters
        </button>
        {!props.isDirty && (
          <p className="text-xs text-(--color-text-muted) -mt-4">Filters are up to date.</p>
        )}
      </div>
    </aside>
  )
}

// ─── Filter modal (mobile) — same fields, opened via the icon next to Sort ────

interface FilterModalProps extends FilterPanelProps {
  isOpen: boolean
  onClose: () => void
}

function FilterModal({ isOpen, onClose, onApply, isDirty, ...fieldProps }: FilterModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] xl:hidden flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full sm:max-w-md max-h-[85vh] bg-(--color-surface) rounded-t-2xl sm:rounded-2xl overflow-y-auto">
        <div className="sticky top-0 bg-(--color-surface) flex items-center justify-between px-6 py-4 border-b border-(--color-border)">
          <h2 className="text-lg font-bold text-(--color-text)">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="w-8 h-8 flex items-center justify-center rounded-full text-(--color-text-muted) hover:bg-(--color-surface-2) transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div
          className="flex flex-col gap-8 p-6"
          style={{ paddingBottom: 'calc(24px + 64px + env(safe-area-inset-bottom))' }}
        >
          <FilterFields {...fieldProps} />
          <button
            type="button"
            onClick={() => { onApply(); onClose() }}
            className="bg-brand text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-dark active:scale-95 transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SortDropdown ─────────────────────────────────────────────────────────────

function SortDropdown({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sort'

  useEffect(() => {
    if (!isOpen) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [isOpen])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 bg-(--color-surface) border border-(--color-border) rounded-full py-2 pl-4 pr-3 text-sm font-medium text-brand shadow-sm cursor-pointer"
      >
        <span>{activeLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 w-52 bg-(--color-surface) border border-(--color-border) rounded-lg z-50 overflow-hidden"
        >
          {SORT_OPTIONS.map((option, i) => {
            const isActive = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => { onChange(option.value); setIsOpen(false) }}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 text-sm text-left cursor-pointer ${
                  isActive ? 'bg-(--color-surface-2) text-brand font-semibold' : 'text-(--color-text) hover:bg-(--color-surface-2)'
                } ${i < SORT_OPTIONS.length - 1 ? 'border-b border-(--color-border)' : ''}`}
              >
                <span>{option.label}</span>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── One timeframe section (upcoming or past) — identical structure for both ──

interface EventsSectionProps {
  title: string
  subtitle: string
  section: ReturnType<typeof useEventSection>
  emptyMessage: string
}

function EventsSection({ title, subtitle, section, emptyMessage }: EventsSectionProps) {
  const { events, isLoading, isLoadingMore, hasMore, loadMore, total } = section

  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-(--color-text)">{title}</h2>
          <p className="text-sm text-(--color-text-muted) mt-1">{subtitle}</p>
        </div>
        {!isLoading && <span className="text-sm text-(--color-text-muted)">{total} event{total !== 1 ? 's' : ''}</span>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => <DiscoveryCardSkeleton key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 border border-dashed border-(--color-border) rounded-2xl bg-(--color-surface-2)/50 flex flex-col items-center justify-center text-center px-6">
          <SearchX className="h-10 w-10 text-(--color-text-muted) mb-4" aria-hidden="true" />
          <p className="text-(--color-text) font-semibold mb-1">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => <DiscoveryEventCard key={event._id} event={event} />)}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 bg-(--color-surface-2) text-(--color-text) px-8 py-3 rounded-full text-sm font-semibold hover:bg-(--color-border)/60 transition-all disabled:opacity-60"
              >
                {isLoadingMore ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Loading…</span>
                  </>
                ) : (
                  <>
                    <span>Load More Events</span>
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EventsBrowseClient({
  initialUpcoming,
  initialPast,
  eventTypes,
  states,
}: EventsBrowseClientProps) {
  const searchParams = useSearchParams()
  const rawCategory = searchParams.get('category')
  const normalizedCategory = rawCategory
    ? QUICK_TYPES.find((t) => t.toLowerCase() === rawCategory.toLowerCase()) ?? rawCategory
    : null

  const initialFilters: Filters = {
    ...EMPTY_FILTERS,
    searchQuery: searchParams.get('q') ?? '',
    types: normalizedCategory ? [normalizedCategory] : [],
    state: searchParams.get('state') ?? '',
  }

  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [draft, setDraft] = useState<Filters>(initialFilters)
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Keep the sidebar draft in sync whenever filters change from outside the
  // sidebar itself (mobile quick pills, URL params) so it never goes stale.
  useEffect(() => { setDraft(filters) }, [filters])

  const isDirty = JSON.stringify(draft) !== JSON.stringify(filters)

  const categories = useMemo(
    () => Array.from(new Set([...QUICK_TYPES, ...eventTypes])),
    [eventTypes]
  )

  const upcoming = useEventSection(filters, sortOption, 'upcoming', initialUpcoming)
  const past = useEventSection(filters, sortOption, 'past', initialPast)

  const hasActive =
    filters.types.length > 0 || !!filters.state || !!filters.minPrice ||
    !!filters.maxPrice || !!filters.dateFrom || !!filters.dateTo

  function handleClear() {
    setFilters(EMPTY_FILTERS)
    setSortOption('newest')
  }

  function toggleMobileType(type: string) {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type) ? prev.types.filter((t) => t !== type) : [type],
    }))
  }

  return (
    <div className="min-h-screen bg-(--color-bg) text-(--color-text) pb-24 pt-6">
      <FilterSidebar
        draft={draft}
        setDraft={setDraft}
        states={states}
        categories={categories}
        onApply={() => setFilters(draft)}
        isDirty={isDirty}
      />

      <FilterModal
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        draft={draft}
        setDraft={setDraft}
        states={states}
        categories={categories}
        onApply={() => setFilters(draft)}
        isDirty={isDirty}
      />

      <div className="xl:ml-60">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-10 py-6 lg:py-10">

          {/* Header & Sort */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-(--color-text) mb-2">
                Discover Events
              </h1>
              <p className="text-lg text-(--color-text-muted)">Find experiences that match your vibe.</p>
            </div>
            <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-(--color-text-muted)">Sort by:</span>
                <SortDropdown value={sortOption} onChange={setSortOption} />
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                aria-label="Open filters"
                className="xl:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-(--color-surface) border border-(--color-border) text-(--color-text) shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                {hasActive && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand border border-(--color-surface)"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Mobile-only quick filters (sidebar is xl:block only) */}
          <div className="flex xl:hidden overflow-x-auto gap-2 pb-4 scrollbar-hide -mx-4 px-4">
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, types: [] }))}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                filters.types.length === 0 ? 'bg-brand text-white' : 'bg-(--color-surface-2) text-(--color-text-muted)'
              }`}
            >
              All Events
            </button>
            {categories.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleMobileType(type)}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors capitalize ${
                  filters.types.includes(type) ? 'bg-brand text-white' : 'bg-(--color-surface-2) text-(--color-text-muted)'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {hasActive && (
            <div className="flex xl:hidden mb-6">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-(--color-text-muted) hover:text-(--color-text) transition-colors"
              >
                Clear all filters ×
              </button>
            </div>
          )}

          {/* ── Upcoming, then Past — same card grid structure for both ── */}
          <EventsSection
            title="Upcoming Events"
            subtitle="What's coming up next"
            section={upcoming}
            emptyMessage="No upcoming events match your filters."
          />
          <EventsSection
            title="Past Events"
            subtitle="Recaps from what you missed"
            section={past}
            emptyMessage="No past events match your filters."
          />

          {/* ── Escape hatch ── */}
          <div className="p-6 bg-(--color-surface) border border-(--color-border) rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-left">
            <div>
              <h3 className="text-xl font-bold text-(--color-text)">Can&apos;t find your vibe?</h3>
              <p className="text-(--color-text-muted) text-sm mt-1">
                Host your own live experience on ComfyTag and launch ticketing in less than 5 minutes.
              </p>
            </div>
            <span
              aria-disabled="true"
              className="inline-flex items-center gap-2 px-6 py-3 bg-(--color-text) text-(--color-bg) font-semibold rounded-xl opacity-60 cursor-not-allowed select-none text-sm whitespace-nowrap mx-auto md:mx-0"
            >
              Create an Event
              <span className="text-[10px] uppercase tracking-wide font-bold bg-(--color-bg)/20 px-2 py-0.5 rounded-full">Coming Soon</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
