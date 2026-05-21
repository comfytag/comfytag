'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { EventCard } from '@/components/ui/EventCard'
import { CategoryCard } from '@/components/ui/CategoryCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { useAuthGate } from '@/hooks/useAuthGate'
import { EmptyState, LoadingSpinner } from '@comfytag/ui'
import type { Event, Category } from '@comfytag/types'
import { formatNaira, authHeader } from '@comfytag/utils'
import api from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

// ── Types ────────────────────────────────────────────────────
type DateFilter = 'all' | 'today' | 'tomorrow' | 'weekend'
type PriceFilter = 'all' | 'free' | 'under5k' | 'under10k'
type AreaFilter = 'all' | 'GRA' | 'Stadium' | 'Tanke' | 'Fate' | 'Unity'

const ILORIN_AREAS: { key: AreaFilter; label: string }[] = [
  { key: 'all', label: 'All areas' },
  { key: 'GRA', label: 'GRA' },
  { key: 'Stadium', label: 'Stadium' },
  { key: 'Tanke', label: 'Tanke' },
  { key: 'Fate', label: 'Fate' },
  { key: 'Unity', label: 'Unity' },
]

interface Suggestion {
  type: 'event' | 'artist' | 'organizer'
  label: string
  href: string
}

interface NotifyMeState {
  email: string
  submitted: boolean
  loading: boolean
}

// ── Server-side data for empty state ────────────────────────
async function loadInitialData(): Promise<{ categories: Category[]; trending: string[] }> {
  try {
    const [catRes, trendRes] = await Promise.all([
      fetch(`${API}/categories`, { cache: 'force-cache' }),
      fetch(`${API}/search/trending`, { next: { revalidate: 3600 } }),
    ])
    const cats: unknown = catRes.ok ? await catRes.json() : []
    const trend: unknown = trendRes.ok ? await trendRes.json() : []
    const catList = (Array.isArray(cats) ? cats : (cats as Record<string, unknown>).data ?? []) as Category[]
    const trendList = (Array.isArray(trend) ? trend : (trend as Record<string, unknown>).data ?? []) as { name?: string; keyword?: string }[]
    return {
      categories: catList.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 8),
      trending: trendList.slice(0, 6).map((t) => t.name ?? t.keyword ?? '').filter(Boolean),
    }
  } catch {
    return { categories: [], trending: [] }
  }
}

export default function SearchPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const initialQ = sp.get('q') ?? ''

  const [query, setQuery] = useState(initialQ)
  const [inputVal, setInputVal] = useState(initialQ)
  const [results, setResults] = useState<Event[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searched, setSearched] = useState(!!initialQ)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all')
  const [seasonal, setSeasonal] = useState<{ title: string; subtitle: string; cta: string; ctaHref: string } | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [notifyMe, setNotifyMe] = useState<NotifyMeState>({ email: '', submitted: false, loading: false })
  const { gateOpen, closeGate, openGate } = useAuthGate()
  const [initData, setInitData] = useState<{ categories: Category[]; trending: string[] }>({ categories: [], trending: [] })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchBarRef = useRef<HTMLDivElement>(null)

  // Load initial data for empty state
  useEffect(() => {
    loadInitialData().then(setInitData)
  }, [])

  // Fetch seasonal config on mount
  useEffect(() => {
    fetch(`${API}/config/seasonal`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (data && typeof data === 'object' && 'title' in data) {
          setSeasonal(data as { title: string; subtitle: string; cta: string; ctaHref: string })
        }
      })
      .catch(() => { /* silent */ })
  }, [])

  // Run search when initialQ changes (URL param)
  useEffect(() => {
    if (initialQ) {
      setInputVal(initialQ)
      setQuery(initialQ)
      runSearch(initialQ)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ])

  // Click outside to close suggestions
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Predictive suggestions (300ms debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (inputVal.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/search/suggestions?q=${encodeURIComponent(inputVal.trim())}`)
        if (!res.ok) return
        const data: unknown = await res.json()
        const raw = (Array.isArray(data) ? data : (data as Record<string, unknown>).data ?? []) as { type?: string; name?: string; title?: string; _id?: string; slug?: string }[]
        const mapped: Suggestion[] = raw.slice(0, 9).map((item) => ({
          type: (item.type as Suggestion['type']) ?? 'event',
          label: item.name ?? item.title ?? '',
          href: item.type === 'event' ? `/events/${item.slug ?? item._id}` : item.type === 'organizer' ? `/organizer/${item.slug ?? item._id}` : `/search?q=${encodeURIComponent(item.name ?? '')}`,
        }))
        setSuggestions(mapped)
        setShowSuggestions(mapped.length > 0)
      } catch {
        // silent
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [inputVal])

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setIsSearching(true)
    setSearched(true)
    setShowSuggestions(false)
    try {
      const res = await fetch(`${API}/events/search?q=${encodeURIComponent(q.trim())}`)
      if (!res.ok) { setResults([]); return }
      const data: unknown = await res.json()
      const list = (Array.isArray(data) ? data : (data as Record<string, unknown>).data ?? []) as Event[]
      setResults(list)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  function handleSearch() {
    const q = inputVal.trim()
    if (!q) return
    setQuery(q)
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false })
    runSearch(q)
  }

  async function handleLike(eventId: string) {
    if (!session) { openGate('like'); return }
    try {
      await api.post(`/events/${eventId}/like`, null, authHeader(session.user.token))
      setLikedIds((prev) => {
        const next = new Set(prev)
        if (next.has(eventId)) next.delete(eventId)
        else next.add(eventId)
        return next
      })
    } catch {
      // silent
    }
  }

  async function handleNotifyMe(e: React.FormEvent) {
    e.preventDefault()
    const email = session?.user?.email ?? notifyMe.email
    if (!email) return
    setNotifyMe((s) => ({ ...s, loading: true }))
    try {
      await api.post('/alerts', { query, email }, authHeader(session?.user?.token))
      setNotifyMe((s) => ({ ...s, submitted: true, loading: false, email }))
    } catch {
      setNotifyMe((s) => ({ ...s, loading: false }))
    }
  }

  // Filter results
  const filtered = results.filter((e) => {
    if (e.status !== 'published') return false
    if (priceFilter === 'free') {
      const min = Math.min(...e.ticketType.map((t) => t.price))
      if (min !== 0) return false
    }
    if (priceFilter === 'under5k') {
      const min = Math.min(...e.ticketType.map((t) => t.price))
      if (min >= 5000) return false
    }
    if (priceFilter === 'under10k') {
      const min = Math.min(...e.ticketType.map((t) => t.price))
      if (min >= 10000) return false
    }
    if (dateFilter === 'today') {
      const d = new Date(e.date)
      const now = new Date()
      if (d.toDateString() !== now.toDateString()) return false
    }
    if (dateFilter === 'tomorrow') {
      const d = new Date(e.date)
      const tom = new Date()
      tom.setDate(tom.getDate() + 1)
      if (d.toDateString() !== tom.toDateString()) return false
    }
    if (dateFilter === 'weekend') {
      const d = new Date(e.date)
      const day = d.getDay()
      if (day !== 0 && day !== 5 && day !== 6) return false
    }
    if (areaFilter !== 'all') {
      const area = areaFilter.toLowerCase()
      if (!(e.address ?? '').toLowerCase().includes(area) && !(e.venue ?? '').toLowerCase().includes(area)) return false
    }
    return true
  })

  const DATE_PILLS: { key: DateFilter; label: string }[] = [
    { key: 'all', label: 'Any date' },
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'weekend', label: 'This Weekend' },
  ]
  const PRICE_PILLS: { key: PriceFilter; label: string }[] = [
    { key: 'all', label: 'Any price' },
    { key: 'free', label: 'Free' },
    { key: 'under5k', label: `Under ${formatNaira(5000)}` },
    { key: 'under10k', label: `Under ${formatNaira(10000)}` },
  ]

  return (
    <>
      <AuthGateSheet isOpen={gateOpen} onClose={closeGate} trigger="like" />
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Seasonal banner */}
        {!searched && seasonal && (
          <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', borderRadius: '16px', padding: '24px', marginBottom: '28px', textAlign: 'center', color: '#ffffff' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>{seasonal.title}</h2>
            <p style={{ fontSize: '14px', margin: '0 0 16px', opacity: 0.9 }}>{seasonal.subtitle}</p>
            <a href={seasonal.ctaHref} style={{ display: 'inline-block', background: '#ffffff', color: '#7C3AED', fontWeight: 700, fontSize: '14px', padding: '10px 24px', borderRadius: '10px', textDecoration: 'none' }}>{seasonal.cta}</a>
          </div>
        )}

        {/* Search bar */}
        <div ref={searchBarRef} style={{ position: 'relative', marginBottom: '28px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              {/* Search icon */}
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
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
                placeholder="Search events, artists, venues…"
                autoFocus={!!initialQ}
                style={{
                  width: '100%', padding: '13px 16px 13px 44px',
                  border: '1.5px solid var(--color-border)', borderRadius: '12px',
                  background: 'var(--color-surface)', fontSize: '15px', color: 'var(--color-text)',
                  outline: 'none', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none',
                  fontFamily: 'inherit',
                }}
                onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              style={{ padding: '0 24px', background: 'var(--color-brand)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
            >
              Search
            </button>
          </div>

          {/* Predictive dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 50, overflow: 'hidden' }}>
              {(['event', 'artist', 'organizer'] as const).map((type) => {
                const group = suggestions.filter((s) => s.type === type).slice(0, 3)
                if (!group.length) return null
                return (
                  <div key={type}>
                    <div style={{ padding: '8px 16px 4px', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {type === 'event' ? 'Events' : type === 'artist' ? 'Artists' : 'Organizers'}
                    </div>
                    {group.map((s) => (
                      <Link
                        key={s.href}
                        href={s.href}
                        onClick={() => setShowSuggestions(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: 'var(--color-text)', textDecoration: 'none', fontSize: '14px', transition: 'background 100ms' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <TypeIcon type={s.type} />
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Empty state: no query yet ─────────────────── */}
        {!searched && (
          <>
            {/* Trending hashtags */}
            {initData.trending.length > 0 && (
              <div style={{ marginBottom: '36px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>Trending now</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {initData.trending.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => { setInputVal(tag); setQuery(tag); router.replace(`/search?q=${encodeURIComponent(tag)}`, { scroll: false }); runSearch(tag) }}
                      style={{ padding: '7px 16px', borderRadius: '99px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer', transition: 'background 150ms ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Spotify-style category grid */}
            {initData.categories.length > 0 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>Browse categories</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                  {initData.categories.map((cat) => (
                    <CategoryCard key={cat._id} category={cat} href={`/category/${cat.slug ?? cat._id}`} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Search results state ─────────────────────── */}
        {searched && (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              {DATE_PILLS.map((p) => (
                <FilterPill key={p.key} label={p.label} active={dateFilter === p.key} onClick={() => setDateFilter(p.key)} />
              ))}
              <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 4px' }} aria-hidden="true" />
              {PRICE_PILLS.slice(1).map((p) => (
                <FilterPill key={p.key} label={p.label} active={priceFilter === p.key} onClick={() => setPriceFilter(p.key === priceFilter ? 'all' : p.key)} />
              ))}
            </div>

            {/* Area filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {ILORIN_AREAS.map((a) => (
                <FilterPill key={a.key} label={a.label} active={areaFilter === a.key} onClick={() => setAreaFilter(a.key === areaFilter ? 'all' : a.key as AreaFilter)} />
              ))}
            </div>

            {isSearching ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '64px' }}>
                <LoadingSpinner size="lg" centered />
              </div>
            ) : filtered.length > 0 ? (
              <>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''} for <strong style={{ color: 'var(--color-text)' }}>"{query}"</strong>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {filtered.map((event) => (
                    <div key={event._id} style={{ position: 'relative' }}>
                      {event.featured && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: '99px', zIndex: 1, pointerEvents: 'none' }}>
                          Sponsored
                        </div>
                      )}
                      <EventCard
                        event={event}
                        href={`/events/${event.slug ?? event._id}`}
                        isLiked={likedIds.has(event._id)}
                        onLike={handleLike}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Zero results */
              <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                <EmptyState
                  title={`No events for "${query}"`}
                  subtitle="Get notified when something matching this shows up."
                />
                {!notifyMe.submitted ? (
                  <form onSubmit={handleNotifyMe} style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                    {!session?.user?.email && (
                      <input
                        type="email"
                        required
                        value={notifyMe.email}
                        onChange={(e) => setNotifyMe((s) => ({ ...s, email: e.target.value }))}
                        placeholder="your@email.com"
                        style={{ padding: '10px 14px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '220px', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit' }}
                      />
                    )}
                    <button
                      type="submit"
                      disabled={notifyMe.loading}
                      style={{ padding: '10px 20px', background: 'var(--color-brand)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: notifyMe.loading ? 0.7 : 1 }}
                    >
                      {notifyMe.loading ? 'Saving…' : 'Notify me'}
                    </button>
                  </form>
                ) : (
                  <p style={{ fontSize: '14px', color: 'var(--color-success)', marginTop: '16px', fontWeight: 500 }}>
                    ✓ We'll notify you at {notifyMe.email}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

/* ── Sub-components ──────────────────────────────────────── */

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: '99px', border: active ? 'none' : '1.5px solid var(--color-border)',
        background: active ? 'var(--color-brand)' : 'var(--color-surface)',
        color: active ? '#ffffff' : 'var(--color-text)',
        fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 150ms ease, color 150ms ease',
      }}
    >
      {label}
    </button>
  )
}

function TypeIcon({ type }: { type: Suggestion['type'] }) {
  if (type === 'event') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  }
  if (type === 'artist') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}
