'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { EventCard } from '@/components/ui/EventCard'
import { FilterPill } from '@/components/search/FilterPill'
import { EmptyState, LoadingSpinner, Skeleton } from '@comfytag/ui'
import { authHeader, NIGERIAN_STATES } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import api from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

export interface EventsBrowseClientProps {
  initialEvents: Event[]
  eventTypes: string[]
  states: string[]
}

interface Filters {
  searchQuery: string
  types: string[]
  state: string
  minPrice: string
  maxPrice: string
}

const SKELETON_COUNT = 12

function EventCardSkeleton() {
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
      <Skeleton height="240px" borderRadius="16px" />
    </div>
  )
}

export function EventsBrowseClient({
  initialEvents,
  eventTypes,
  states,
}: EventsBrowseClientProps) {
  const { data: session } = useSession()

  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialEvents.length === 12)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    types: [],
    state: '',
    minPrice: '',
    maxPrice: '',
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // All available states: merge API response with NIGERIAN_STATES fallback
  const allStates: string[] = Array.from(
    new Set([...states, ...NIGERIAN_STATES])
  ).sort()

  const buildParams = useCallback(
    (currentFilters: Filters, currentPage: number) => {
      const params = new URLSearchParams()
      params.set('limit', '12')
      params.set('page', String(currentPage))
      if (currentFilters.searchQuery.trim()) params.set('q', currentFilters.searchQuery.trim())
      if (currentFilters.types.length > 0) params.set('type', currentFilters.types.join(','))
      if (currentFilters.state) params.set('state', currentFilters.state)
      if (currentFilters.minPrice) params.set('minPrice', currentFilters.minPrice)
      if (currentFilters.maxPrice) params.set('maxPrice', currentFilters.maxPrice)
      return params.toString()
    },
    []
  )

  const fetchEvents = useCallback(
    async (currentFilters: Filters, currentPage: number, append = false) => {
      const isFreshLoad = currentPage === 1 && !append
      if (isFreshLoad) setIsLoading(true)
      else setIsLoadingMore(true)

      try {
        const hasSearch = currentFilters.searchQuery.trim() ||
          currentFilters.types.length > 0 ||
          currentFilters.state ||
          currentFilters.minPrice ||
          currentFilters.maxPrice

        const endpoint = hasSearch ? '/events/search' : '/events'
        const qs = buildParams(currentFilters, currentPage)
        const config = authHeader(session?.user?.token)

        const response = await api.get(`${endpoint}?${qs}`, config)
        const data = response.data
        const list: Event[] = Array.isArray(data)
          ? data
          : (data?.data ?? data?.events ?? []) as Event[]
        const total: number = data?.total ?? data?.count ?? list.length

        if (isFreshLoad) {
          setEvents(list)
          setTotalCount(total)
        } else {
          setEvents((prev) => [...prev, ...list])
        }

        setHasMore(list.length === 12)
        setPage(currentPage)
      } catch {
        if (isFreshLoad) setEvents([])
      } finally {
        if (isFreshLoad) setIsLoading(false)
        else setIsLoadingMore(false)
      }
    },
    [session, buildParams]
  )

  // Debounce search query changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchEvents(filters, 1, false)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  function handleTypeToggle(type: string) {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }))
  }

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setFilters((prev) => ({ ...prev, state: e.target.value }))
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
  }

  function handleMinPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilters((prev) => ({ ...prev, minPrice: e.target.value }))
  }

  function handleMaxPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
  }

  function handleLoadMore() {
    fetchEvents(filters, page + 1, true)
  }

  function handleClearFilters() {
    setFilters({ searchQuery: '', types: [], state: '', minPrice: '', maxPrice: '' })
  }

  const hasActiveFilters =
    !!filters.searchQuery ||
    filters.types.length > 0 ||
    !!filters.state ||
    !!filters.minPrice ||
    !!filters.maxPrice

  const displayCount = totalCount ?? events.length

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-text)',
            margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          Browse Events
        </h1>
        {!isLoading && (
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            {hasActiveFilters
              ? `${displayCount} result${displayCount !== 1 ? 's' : ''} found`
              : `${displayCount} event${displayCount !== 1 ? 's' : ''} available`}
          </p>
        )}
      </div>

      {/* ── Filter bar ── */}
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
        {/* Search input row */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search events, artists, venues…"
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              border: '1.5px solid var(--color-border)',
              borderRadius: '12px',
              background: 'var(--color-surface)',
              fontSize: '15px',
              color: 'var(--color-text)',
              outline: 'none',
              boxSizing: 'border-box',
              appearance: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            aria-label="Search events"
          />
        </div>

        {/* Type pills + state + price */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          {/* Type filter pills */}
          {eventTypes.length > 0 &&
            eventTypes.map((type) => (
              <FilterPill
                key={type}
                label={type}
                active={filters.types.includes(type)}
                onClick={() => handleTypeToggle(type)}
              />
            ))}

          {/* State dropdown */}
          <select
            value={filters.state}
            onChange={handleStateChange}
            style={{
              padding: '8px 12px',
              borderRadius: '99px',
              border: filters.state
                ? '1.5px solid var(--color-brand)'
                : '1.5px solid var(--color-border)',
              background: filters.state ? 'var(--color-brand)' : 'var(--color-surface)',
              color: filters.state ? '#ffffff' : 'var(--color-text)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              paddingRight: '28px',
            }}
            aria-label="Filter by state"
          >
            <option value="">All states</option>
            {allStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Price range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="number"
              value={filters.minPrice}
              onChange={handleMinPriceChange}
              placeholder="Min ₦"
              min={0}
              style={{
                width: '80px',
                padding: '8px 10px',
                border: '1.5px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                fontSize: '13px',
                color: 'var(--color-text)',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              aria-label="Minimum price"
            />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>–</span>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={handleMaxPriceChange}
              placeholder="Max ₦"
              min={0}
              style={{
                width: '80px',
                padding: '8px 10px',
                border: '1.5px solid var(--color-border)',
                borderRadius: '8px',
                background: 'var(--color-surface)',
                fontSize: '13px',
                color: 'var(--color-text)',
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              aria-label="Maximum price"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                padding: '8px 14px',
                borderRadius: '99px',
                border: '1.5px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              Clear filters ×
            </button>
          )}
        </div>
      </div>

      {/* ── Content area ── */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: '20px',
          }}
          className="events-grid"
        >
          <style>{`
            @media (min-width: 768px) { .events-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (min-width: 1024px) { .events-grid { grid-template-columns: repeat(3, 1fr) !important; } }
          `}</style>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          subtitle={
            hasActiveFilters
              ? 'Try adjusting your filters or search for something else.'
              : 'No events are available right now. Check back soon!'
          }
          action={
            hasActiveFilters
              ? { label: 'Clear Filters', href: '/events' }
              : undefined
          }
        />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(1, 1fr)',
              gap: '20px',
            }}
            className="events-grid"
          >
            <style>{`
              @media (min-width: 768px) { .events-grid { grid-template-columns: repeat(2, 1fr) !important; } }
              @media (min-width: 1024px) { .events-grid { grid-template-columns: repeat(3, 1fr) !important; } }
            `}</style>
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                href={`/events/${event.slug ?? event._id}`}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '40px',
              }}
            >
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                style={{
                  padding: '12px 32px',
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  cursor: isLoadingMore ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isLoadingMore ? 0.7 : 1,
                  transition: 'background 150ms',
                }}
              >
                {isLoadingMore ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Loading…
                  </>
                ) : (
                  'Load More Events'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
