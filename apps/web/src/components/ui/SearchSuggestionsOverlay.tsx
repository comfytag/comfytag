'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Event } from '@comfytag/types'
import { formatDate } from '@comfytag/utils'
import api from '@/lib/api'

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
    <>
      <style>{`
        .__ct_sugg_row { display:flex; align-items:center; gap:12px; padding:10px 16px; text-decoration:none; border-bottom:1px solid var(--color-border); background:transparent; transition:background 120ms ease; }
        .__ct_sugg_row:hover { background:var(--color-surface-2); }
        .__ct_sugg_row:last-of-type { border-bottom:none; }
      `}</style>
      <div
        onMouseDown={(e) => e.preventDefault()}
        role="listbox"
        aria-label="Search suggestions"
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 300,
          overflow: 'hidden',
          maxHeight: '420px',
          overflowY: 'auto',
        }}
      >
        {/* Header label */}
        <div style={{ padding: '10px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            {loading ? 'Searching…' : hasQuery ? `Results` : 'Trending Events'}
          </span>
          {hasQuery && !loading && results.length > 0 && (
            <Link
              href={`/events?q=${encodeURIComponent(query.trim())}`}
              onClick={onClose}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-brand)', textDecoration: 'none' }}
            >
              See all →
            </Link>
          )}
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px', borderTop: '1px solid var(--color-border)' }}>
            No events found for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Loading skeleton rows */}
        {loading && (
          <div style={{ borderTop: '1px solid var(--color-border)' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, borderRadius: 4, background: 'var(--color-surface-2)', marginBottom: 6, width: '60%' }} />
                  <div style={{ height: 11, borderRadius: 4, background: 'var(--color-surface-2)', width: '40%' }} />
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
              className="__ct_sugg_row"
              role="option"
              aria-selected="false"
            >
              {/* Thumbnail */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-2)',
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                {thumb && (
                  <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatDate(event.date)}{event.venue ? ` · ${event.venue}` : ''}
                </p>
              </div>

              {/* Arrow */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          )
        })}
      </div>
    </>
  )
}
