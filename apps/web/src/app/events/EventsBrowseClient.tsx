'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { EventCard } from '@/components/ui/EventCard'
import { FilterPill } from '@/components/search/FilterPill'
import { MapView } from '@/components/search/MapView'
import { EmptyState, LoadingSpinner, Skeleton } from '@comfytag/ui'
import { authHeader, NIGERIAN_STATES } from '@comfytag/utils'
import { formatDate } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import api from '@/lib/api'

export interface EventsBrowseClientProps {
  initialEvents: Event[]
  eventTypes: string[]
  states: string[]
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'map'

interface Filters {
  searchQuery: string
  types: string[]
  state: string
  minPrice: string
  maxPrice: string
  dateSort: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SKELETON_COUNT = 12
const QUICK_TYPES = ['Music', 'Comedy', 'Tech', 'Sports', 'Art']

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
      <Skeleton height="240px" borderRadius="16px" />
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode
  onChange: (v: ViewMode) => void
}) {
  return (
    <div
      role="group"
      aria-label="View mode"
      style={{
        display: 'flex',
        gap: '4px',
        background: 'var(--color-surface-2)',
        borderRadius: 'var(--radius-full)',
        padding: '4px',
        flexShrink: 0,
      }}
    >
      {(['list', 'map'] as ViewMode[]).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={() => onChange(v)}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: view === v ? 'var(--color-brand)' : 'transparent',
            color: view === v ? 'var(--color-text-on-brand)' : 'var(--color-text-muted)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--duration-fast)',
            textTransform: 'capitalize',
          }}
        >
          {v === 'list' ? 'List' : 'Map'}
        </button>
      ))}
    </div>
  )
}

// Groups events by date label and returns ordered pairs [dateLabel, events[]]
function groupByDate(events: Event[]): [string, Event[]][] {
  const map = new Map<string, Event[]>()
  for (const event of events) {
    const label = formatDate(event.date) || 'Upcoming'
    const bucket = map.get(label) ?? []
    bucket.push(event)
    map.set(label, bucket)
  }
  return Array.from(map.entries())
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EventsBrowseClient({
  initialEvents,
  eventTypes,
  states,
}: EventsBrowseClientProps) {
  const router = useRouter()
  const { data: session } = useSession()

  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialEvents.length === 12)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    types: [],
    state: '',
    minPrice: '',
    maxPrice: '',
    dateSort: false,
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const allStates = useMemo(
    () => Array.from(new Set([...states, ...NIGERIAN_STATES])).sort(),
    [states]
  )

  const buildParams = useCallback((f: Filters, p: number) => {
    const params = new URLSearchParams()
    params.set('limit', '12')
    params.set('page', String(p))
    if (f.searchQuery.trim()) params.set('q', f.searchQuery.trim())
    if (f.types.length > 0) params.set('type', f.types.join(','))
    if (f.state) params.set('state', f.state)
    if (f.minPrice) params.set('minPrice', f.minPrice)
    if (f.maxPrice) params.set('maxPrice', f.maxPrice)
    if (f.dateSort) params.set('sort', 'date')
    return params.toString()
  }, [])

  const fetchEvents = useCallback(
    async (f: Filters, p: number, append = false) => {
      const fresh = p === 1 && !append
      if (fresh) setIsLoading(true)
      else setIsLoadingMore(true)

      try {
        const hasSearch =
          f.searchQuery.trim() || f.types.length > 0 || f.state || f.minPrice || f.maxPrice
        const endpoint = hasSearch ? '/events/search' : '/events'
        const response = await api.get(`${endpoint}?${buildParams(f, p)}`, authHeader(session?.user?.token))
        const data = response.data as Record<string, unknown>
        const list: Event[] = Array.isArray(data)
          ? (data as Event[])
          : ((data?.data ?? data?.events ?? []) as Event[])
        const total = (data?.total ?? data?.count ?? list.length) as number

        if (fresh) { setEvents(list); setTotalCount(total) }
        else setEvents((prev) => [...prev, ...list])

        setHasMore(list.length === 12)
        setPage(p)
      } catch {
        if (fresh) setEvents([])
      } finally {
        if (fresh) setIsLoading(false)
        else setIsLoadingMore(false)
      }
    },
    [session, buildParams]
  )

  // Debounce filter changes
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { void fetchEvents(filters, 1) }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function toggleType(type: string) {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }))
  }

  function toggleAll() {
    setFilters((prev) => ({ ...prev, types: [] }))
  }

  function toggleDateSort() {
    setFilters((prev) => ({ ...prev, dateSort: !prev.dateSort }))
  }

  function handleClear() {
    setFilters({ searchQuery: '', types: [], state: '', minPrice: '', maxPrice: '', dateSort: false })
  }

  function handleLoadMore() {
    void fetchEvents(filters, page + 1, true)
  }

  function handleEventSelect(id: string) {
    const event = events.find((e) => e._id === id)
    if (event) router.push(`/events/${event.slug ?? event._id}`)
  }

  // ─── Derived state ─────────────────────────────────────────────────────────

  const hasActive =
    !!filters.searchQuery ||
    filters.types.length > 0 ||
    !!filters.state ||
    !!filters.minPrice ||
    !!filters.maxPrice ||
    filters.dateSort

  const displayCount = totalCount ?? events.length
  const dateGroups = useMemo(() => groupByDate(events), [events])

  // Merge quick types with API types (deduplicate)
  const pillTypes = useMemo(
    () => Array.from(new Set([...QUICK_TYPES, ...eventTypes])).slice(0, 8),
    [eventTypes]
  )

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Browse Events
        </h1>
        {!isLoading && (
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            {hasActive
              ? `${displayCount} result${displayCount !== 1 ? 's' : ''} found`
              : `${displayCount} event${displayCount !== 1 ? 's' : ''} available`}
          </p>
        )}
      </div>

      {/* ── Filter bar (sticky) ── */}
      <div
        style={{
          position: 'sticky',
          top: '64px',
          zIndex: 20,
          background: 'var(--color-bg-public, #FAFAF9)',
          paddingTop: '12px',
          paddingBottom: '16px',
          marginBottom: '28px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {/* Search row */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search events, artists, venues…"
            aria-label="Search events"
            style={{
              width: '100%', padding: '12px 16px 12px 44px',
              border: '1.5px solid var(--color-border)', borderRadius: '12px',
              background: 'var(--color-surface)', fontSize: '15px',
              color: 'var(--color-text)', outline: 'none',
              boxSizing: 'border-box', appearance: 'none', fontFamily: 'inherit',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Pills row + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flex: 1 }}>
            {/* All pill */}
            <FilterPill
              label="All"
              active={filters.types.length === 0}
              onClick={toggleAll}
            />

            {/* Quick category pills */}
            {pillTypes.map((type) => (
              <FilterPill
                key={type}
                label={type}
                active={filters.types.includes(type)}
                onClick={() => toggleType(type)}
              />
            ))}

            {/* Date sort pill */}
            <FilterPill
              label="Date ▾"
              active={filters.dateSort}
              onClick={toggleDateSort}
            />

            {/* State dropdown */}
            <select
              value={filters.state}
              onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}
              aria-label="Filter by state"
              style={{
                padding: '8px 28px 8px 12px', borderRadius: 'var(--radius-full)',
                border: filters.state ? '1.5px solid var(--color-brand)' : '1.5px solid var(--color-border)',
                background: filters.state ? 'var(--color-brand)' : 'var(--color-surface)',
                color: filters.state ? 'var(--color-text-on-brand)' : 'var(--color-text)',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                outline: 'none', appearance: 'none',
              }}
            >
              <option value="">All states</option>
              {allStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Clear */}
            {hasActive && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '8px 14px', borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--color-border)', background: 'transparent',
                  color: 'var(--color-text-muted)', fontSize: '13px',
                  fontWeight: 500, cursor: 'pointer',
                }}
              >
                Clear ×
              </button>
            )}
          </div>

          {/* List / Map toggle */}
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* ── Content area ── */}
      {isLoading ? (
        <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
          <style>{`
            @media (min-width: 640px) { .events-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (min-width: 1024px) { .events-grid { grid-template-columns: repeat(3, 1fr) !important; } }
            @media (min-width: 1280px) { .events-grid { grid-template-columns: repeat(4, 1fr) !important; } }
          `}</style>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>

      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          subtitle={hasActive ? 'Try adjusting your filters or search for something else.' : 'No events are available right now. Check back soon!'}
          action={hasActive ? { label: 'Clear Filters', href: '/events' } : undefined}
        />

      ) : viewMode === 'map' ? (
        /* ── Map view ── */
        <div style={{ height: '600px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <MapView
            events={events}
            onEventSelect={handleEventSelect}
          />
        </div>

      ) : (
        /* ── List view (RA date-group style) ── */
        <>
          <style>{`
            .events-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 20px; }
            @media (min-width: 640px) { .events-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (min-width: 1024px) { .events-grid { grid-template-columns: repeat(3, 1fr) !important; } }
            @media (min-width: 1280px) { .events-grid { grid-template-columns: repeat(4, 1fr) !important; } }
          `}</style>

          {dateGroups.map(([dateLabel, groupEvents]) => (
            <section key={dateLabel} style={{ marginBottom: '36px' }}>
              {/* Bold date header */}
              <h2
                style={{
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--color-text-muted)',
                  margin: '0 0 14px', paddingBottom: '8px',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {dateLabel}
              </h2>

              <div className="events-grid">
                {groupEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    href={`/events/${event.slug ?? event._id}`}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Load more */}
          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                style={{
                  padding: '12px 32px', background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-border)', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 600, color: 'var(--color-text)',
                  cursor: isLoadingMore ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: isLoadingMore ? 0.7 : 1, transition: 'background var(--duration-fast)',
                }}
              >
                {isLoadingMore ? <><LoadingSpinner size="sm" />Loading…</> : 'Load More Events'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
