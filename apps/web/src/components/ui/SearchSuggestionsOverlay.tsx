'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@comfytag/types'
import { formatDate } from '@comfytag/utils'
import { api } from '@/lib/api'

interface SearchSuggestionsOverlayProps {
  query: string
  isOpen: boolean
  onClose: () => void
}

function normalizeEvents(data: unknown): Event[] {
  if (Array.isArray(data)) return data as Event[]
  const obj = data as Record<string, unknown>
  return (Array.isArray(obj.events) ? obj.events : Array.isArray(obj.data) ? obj.data : []) as Event[]
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

export function SearchSuggestionsOverlay({ query, isOpen, onClose }: SearchSuggestionsOverlayProps) {
  const [results, setResults] = useState<Event[]>([])
  const [trending, setTrending] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/search/trending')
      .then(r => {
        const d = r.data as Record<string, unknown>
        const list = Array.isArray(d.data) ? d.data : normalizeEvents(r.data)
        setTrending((list as Event[]).slice(0, 6))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    const id = setTimeout(() => {
      api.get(`/search/suggestions?q=${encodeURIComponent(query.trim())}`)
        .then(r => {
          const d = r.data as { events?: Event[]; artists?: unknown[]; organizers?: unknown[] }
          setResults((d.events ?? []).slice(0, 6))
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 280)
    return () => clearTimeout(id)
  }, [query])

  if (!isOpen) return null

  const hasQuery = query.trim().length > 0
  const items = hasQuery ? results : trending
  const isEmpty = hasQuery && !loading && results.length === 0

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      role="listbox"
      aria-label="Search suggestions"
      className="absolute top-full mt-2 w-full z-100 bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase">
          {loading ? 'Searching…' : hasQuery ? 'Results' : 'Trending Events'}
        </span>
        {hasQuery && !loading && results.length > 0 && (
          <Link
            href={`/events?q=${encodeURIComponent(query.trim())}`}
            onClick={onClose}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            See all →
          </Link>
        )}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <p className="px-5 py-8 text-center text-sm text-zinc-400">
          No events found for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-zinc-50 last:border-0 animate-pulse">
              <div className="w-12 h-12 shrink-0 rounded-lg bg-zinc-100" />
              <div className="flex flex-col flex-1 gap-2">
                <div className="h-3.5 rounded bg-zinc-100 w-3/5" />
                <div className="h-3 rounded bg-zinc-100 w-2/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && items.map((event) => {
        const thumb = event.coverImage ?? event.images?.[0]
        return (
          <Link
            key={event._id}
            href={`/events/${event.slug ?? event._id}`}
            onClick={onClose}
            role="option"
            aria-selected="false"
            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 group cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative w-12 h-12 shrink-0 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden">
              {thumb && (
                <Image
                  src={thumb}
                  alt=""
                  fill
                  className="object-cover"
                />
              )}
            </div>

            {/* Text block */}
            <div className="flex flex-col flex-1 min-w-0 text-left">
              <p className="text-base font-bold text-zinc-900 truncate group-hover:text-violet-600 transition-colors">
                {toTitleCase(event.name)}
              </p>
              <p className="text-sm font-medium text-zinc-500 truncate mt-0.5">
                {formatDate(event.date)}
                {event.venue ? ` · ${toTitleCase(event.venue)}` : ''}
              </p>
            </div>

            {/* Chevron */}
            <div className="shrink-0 text-zinc-300 group-hover:text-violet-500 transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
