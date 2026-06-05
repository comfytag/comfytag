'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { EventCard } from '@/components/ui/EventCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { useAuthGate } from '@/hooks/useAuthGate'
import { EmptyState } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { formatDate, isToday, isUpcoming } from '@comfytag/utils'
import { api } from '@/lib/api'
import { authHeader } from '@comfytag/utils'

const PAGE_SIZE = 12

interface EventFeedSectionProps {
  events?: Event[]
  initialEvents?: Event[]
  onEventSelect?: (id: string) => void
  activeCategory?: string
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
        .filter((e) => e.status === 'published' && isToday(e.date) && (!activeCategory || e.category.toLowerCase() === activeCategory.toLowerCase()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 8),
    [eventList, activeCategory]
  )

  // All upcoming events in a single flat grid (sorted by date)
  const allUpcomingEvents = useMemo(
    () =>
      eventList
        .filter((e) => e.status === 'published' && isUpcoming(e.date) && (!activeCategory || e.category.toLowerCase() === activeCategory.toLowerCase()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [eventList, activeCategory]
  )

  async function handleLike(eventId: string) {
    if (!session) {
      openGate('like')
      return
    }
    try {
      await api.post(`/events/${eventId}/like`, null)
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
  const visibleUpcomingEvents = useMemo(() => allUpcomingEvents.slice(0, visibleCount), [allUpcomingEvents, visibleCount])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && allUpcomingEvents.length > visibleCount) {
          setVisibleCount((c) => c + PAGE_SIZE)
        }
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [allUpcomingEvents.length, visibleCount])

  return (
    <>
      <style>{`
        .ct-scroll-row::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <AuthGateSheet isOpen={gateOpen} onClose={closeGate} trigger="like" />

      <section style={{ padding: '0 16px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: '28px', paddingBottom: '48px' }}>
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

        {/* Upcoming events grid — single flat grid */}
        {visibleUpcomingEvents.length === 0 && tonight.length === 0 ? (
          <EmptyState
            title="No events right now"
            subtitle="Check back soon — new events are added all the time."
            action={{ label: 'Browse all', href: '/events' }}
          />
        ) : (
          <>
            {/* Single flat grid of all upcoming events */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '14px',
                marginBottom: '24px',
              }}
            >
              {visibleUpcomingEvents.map((event) => (
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

            {/* Browse all CTA — shown after all events are loaded */}
            {visibleUpcomingEvents.length > 0 && allUpcomingEvents.length <= visibleCount && (
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
        {allUpcomingEvents.length > visibleCount && (
          <div ref={sentinelRef} style={{ height: '40px', marginTop: '8px' }} aria-hidden="true" />
        )}
        </div>
      </section>
    </>
  )
}
