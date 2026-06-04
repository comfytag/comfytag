'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { EventCard } from '@/components/ui/EventCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { useAuthGate } from '@/hooks/useAuthGate'
import { EmptyState } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { formatDate, isToday, isUpcoming } from '@comfytag/utils'
import api from '@/lib/api'
import { authHeader } from '@comfytag/utils'

const PAGE_SIZE = 12

interface EventFeedSectionProps {
  events?: Event[]
  initialEvents?: Event[]
  onEventSelect?: (id: string) => void
  activeCategory?: string
}

function isThisWeekend(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const day = d.getDay()
  const diff = d.getTime() - now.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 7 && (day === 0 || day === 5 || day === 6)
}

interface DateGroup {
  label: string
  date?: string
  events: Event[]
}

function groupByDate(events: Event[]): DateGroup[] {
  const published = events.filter((e) => e.status === 'published')
  const today = published.filter((e) => isToday(e.date))
  const weekend = published.filter((e) => !isToday(e.date) && isThisWeekend(e.date))
  const upcoming = published.filter((e) => !isToday(e.date) && !isThisWeekend(e.date) && isUpcoming(e.date))

  const groups: DateGroup[] = []
  if (today.length) groups.push({ label: 'TODAY', date: today[0].date, events: today })
  if (weekend.length) {
    // Group weekend events by date
    const weekendByDate = new Map<string, Event[]>()
    weekend.forEach((e) => {
      const key = e.date
      if (!weekendByDate.has(key)) weekendByDate.set(key, [])
      weekendByDate.get(key)!.push(e)
    })
    Array.from(weekendByDate.entries()).forEach(([date, evts]) => {
      groups.push({ label: formatDate(date), date, events: evts })
    })
  }
  if (upcoming.length) {
    // Group upcoming events by date
    const upcomingByDate = new Map<string, Event[]>()
    upcoming.forEach((e) => {
      const key = e.date
      if (!upcomingByDate.has(key)) upcomingByDate.set(key, [])
      upcomingByDate.get(key)!.push(e)
    })
    Array.from(upcomingByDate.entries()).forEach(([date, evts]) => {
      groups.push({ label: formatDate(date), date, events: evts })
    })
  }

  return groups
}

export function EventFeedSection({
  events = [],
  initialEvents = [],
  onEventSelect,
  activeCategory,
}: EventFeedSectionProps) {
  const { data: session } = useSession()
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const { gateOpen, closeGate, openGate } = useAuthGate()
  const eventList = initialEvents.length > 0 ? initialEvents : events

  // Tonight row (compact horizontal scroll)
  const tonight = useMemo(
    () =>
      eventList
        .filter((e) => e.status === 'published' && isToday(e.date) && (!activeCategory || e.category === activeCategory))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 8),
    [eventList, activeCategory]
  )

  // This weekend row (compact horizontal scroll)
  const thisWeekend = useMemo(
    () =>
      eventList
        .filter((e) => e.status === 'published' && isThisWeekend(e.date) && !isToday(e.date) && (!activeCategory || e.category === activeCategory))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 8),
    [eventList, activeCategory]
  )

  // Date-grouped grid below
  const groups = useMemo(() => groupByDate(eventList), [eventList])

  async function handleLike(eventId: string) {
    if (!session) {
      openGate('like')
      return
    }
    try {
      await api.post(`/events/${eventId}/like`, null, authHeader(session.user.token))
      setLikedIds((prev) => {
        const next = new Set(prev)
        if (next.has(eventId)) next.delete(eventId)
        else next.add(eventId)
        return next
      })
    } catch {
      // silent fail
    }
  }

  const sentinelRef = useRef<HTMLDivElement>(null)
  const allFeedEvents = groups.flatMap((g) => g.events)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && allFeedEvents.length > visibleCount) {
          setVisibleCount((c) => c + PAGE_SIZE)
        }
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [allFeedEvents.length, visibleCount])

  const visibleGroups = useMemo(() => {
    let remaining = visibleCount
    return groups
      .map((g) => ({
        ...g,
        events: g.events.slice(0, Math.max(0, remaining)),
      }))
      .filter((g, i) => {
        remaining -= groups[i].events.length
        return g.events.length > 0
      })
  }, [groups, visibleCount])

  return (
    <>
      <style>{`
        .ct-scroll-row::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <AuthGateSheet isOpen={gateOpen} onClose={closeGate} trigger="like" />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 48px' }}>
        {/* TONIGHT → horizontal scroll row */}
        {tonight.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                marginBottom: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              TONIGHT
            </h2>
            <div
              className="ct-scroll-row"
              style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {tonight.map((event) => (
                <div key={event._id} style={{ flexShrink: 0, width: '160px' }}>
                  <EventCard
                    event={event}
                    href={`/events/${event.slug ?? event._id}`}
                    isLiked={likedIds.has(event._id)}
                    onLike={handleLike}
                    compact
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* THIS WEEKEND → horizontal scroll row */}
        {thisWeekend.length > 0 && (
          <section style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                marginBottom: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              THIS WEEKEND
            </h2>
            <div
              className="ct-scroll-row"
              style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollBehavior: 'smooth',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {thisWeekend.map((event) => (
                <div key={event._id} style={{ flexShrink: 0, width: '160px' }}>
                  <EventCard
                    event={event}
                    href={`/events/${event.slug ?? event._id}`}
                    isLiked={likedIds.has(event._id)}
                    onLike={handleLike}
                    compact
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Date-grouped grid section (RA style) */}
        {visibleGroups.length === 0 ? (
          <EmptyState
            title="No events right now"
            subtitle="Check back soon — new events are added all the time."
            action={{ label: 'Browse all', href: '/events' }}
          />
        ) : (
          <>
            {visibleGroups.map((group) => (
              <section key={group.label} style={{ marginBottom: '28px' }}>
                <h3
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    marginBottom: '10px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {group.label}
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {group.events.map((event) => (
                    <div
                      key={event._id}
                      onClick={() => onEventSelect?.(event._id)}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onEventSelect?.(event._id)
                        }
                      }}
                    >
                      <EventCard
                        event={event}
                        href={`/events/${event.slug ?? event._id}`}
                        isLiked={likedIds.has(event._id)}
                        onLike={handleLike}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Browse all CTA — shown after last event group */}
            {visibleGroups.length > 0 && allFeedEvents.length <= visibleCount && (
              <div
                style={{
                  marginTop: '48px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <a
                  href="/events"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'var(--color-brand)',
                    color: 'var(--color-text-on-brand)',
                    fontSize: '14px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-md)',
                    transition: 'opacity var(--duration-fast) ease',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  Browse all events
                  <span style={{ fontSize: '16px' }}>→</span>
                </a>
              </div>
            )}
          </>
        )}

        {/* Infinite scroll sentinel */}
        {allFeedEvents.length > visibleCount && (
          <div ref={sentinelRef} style={{ height: '40px', marginTop: '8px' }} aria-hidden="true" />
        )}
      </div>
    </>
  )
}
