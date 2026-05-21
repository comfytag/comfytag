'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { EventHeroCarousel } from '@/components/event/EventHeroCarousel'
import { EventTransparentNav } from '@/components/event/EventTransparentNav'
import { TicketTierSheet } from '@/components/event/TicketTierSheet'
import { CommentSection, type Comment } from '@/components/event/CommentSection'
import { OrganizerCard, type OrganizerStats } from '@/components/ui/OrganizerCard'
import { StickyBottomBar } from '@/components/ui/StickyBottomBar'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { EventCard } from '@/components/ui'
import { BackLink } from '@/components/ui/BackLink'
import { CalendarIcon, MapPinIcon, HeartIcon } from '@/components/events/EventIcons'
import { useLike } from '@/hooks/useLike'
import { useAuthGate } from '@/hooks/useAuthGate'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { authHeader, formatNaira, formatDate, formatTime, initials } from '@comfytag/utils'
import type { Event as EventType } from '@comfytag/types'
import api from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: session } = useSession()

  const [event, setEvent] = useState<EventType | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [orgStats, setOrgStats] = useState<OrganizerStats | null>(null)
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false)
  const [heroVisible, setHeroVisible] = useState(true)
  const [relatedEvents, setRelatedEvents] = useState<EventType[]>([])
  const [shareToast, setShareToast] = useState(false)
  const [hypeLinkLoading, setHypeLinkLoading] = useState(false)

  const { gateOpen, gateTrigger, openGate, closeGate } = useAuthGate()
  const { isLiked, likeCount, toggleLike } = useLike(event?._id || '', false, event?.sold)

  const heroRef = useRef<HTMLDivElement>(null)

  const fetchEvent = useCallback(async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/events/${slug}`)
      if (!res.ok) throw new Error('Event not found')
      const data = (await res.json()) as EventType
      setEvent(data)

      // Parallel: comments + follow status + org stats + related events
      const headers: HeadersInit = {}
      if (session?.user?.token) {
        ;(headers as Record<string, string>)['Authorization'] = `Bearer ${session.user.token}`
      }
      const [commentsRes, followRes, statsRes, relatedRes] = await Promise.allSettled([
        fetch(`${API}/events/${data._id}/comments?page=1&limit=20`, { headers }),
        fetch(`${API}/organizers/${data.planner_id}/follow/status`, { headers }),
        fetch(`${API}/organizers/${data.planner_id}/stats`, { headers }),
        fetch(`${API}/events?category=${encodeURIComponent(data.category)}&status=published`, { headers }),
      ])

      if (commentsRes.status === 'fulfilled' && commentsRes.value.ok) {
        const cd = (await commentsRes.value.json()) as {
          comments: Comment[]
          hasMore: boolean
        }
        setComments(cd.comments ?? [])
        setHasMoreComments(cd.hasMore ?? false)
      }

      if (followRes.status === 'fulfilled' && followRes.value.ok) {
        const fd = (await followRes.value.json()) as {
          following: boolean
          followerCount: number
        }
        setIsFollowing(fd.following)
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const sd = (await statsRes.value.json()) as OrganizerStats
        setOrgStats(sd)
      }

      if (relatedRes.status === 'fulfilled' && relatedRes.value.ok) {
        const rd = await relatedRes.value.json()
        const list = (Array.isArray(rd) ? rd : rd.data ?? rd.events ?? []) as EventType[]
        setRelatedEvents(list.filter(e => e._id !== data._id && e.status === 'published').slice(0, 4))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  // IntersectionObserver for sticky bar visibility
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  async function handleLike() {
    if (!session) {
      openGate('like')
      return
    }
    await toggleLike()
  }

  async function handleFollow() {
    if (!session) {
      openGate('like')
      return
    }
    if (!event) return
    try {
      const res = await api.post<{ following: boolean; followerCount: number }>(
        `/organizers/${event.planner_id}/follow`,
        null,
        authHeader(session.user.token),
      )
      setIsFollowing(res.data.following)
      if (orgStats) {
        setOrgStats({ ...orgStats, followerCount: res.data.followerCount })
      }
    } catch {
      // silent
    }
  }

  async function handleShare() {
    if (!event) return
    const url = `${window.location.origin}/events/${event.slug ?? event._id}`
    if (navigator.share) {
      await navigator.share({ title: event.name, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    }
  }

  async function handleHypeLink() {
    if (!session) { openGate('hype-link'); return }
    if (!event) return
    setHypeLinkLoading(true)
    try {
      const r = await api.get(`/referral/${event._id}`, authHeader(session.user.token))
      const refUrl: string = r.data?.url ?? r.data?.referralUrl ?? `${window.location.origin}/events/${event.slug ?? event._id}?ref=${session.user.id}`
      const text = `Omo, you dey go ${event.name}? 🔥 Use my link:`
      if (navigator.share) {
        await navigator.share({ title: event.name, text, url: refUrl }).catch(() => {})
      } else {
        await navigator.clipboard.writeText(refUrl).catch(() => {})
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      }
    } catch {
      // silent
    } finally {
      setHypeLinkLoading(false)
    }
  }

  function handleCheckout(tierId: string, qty: number) {
    if (!event) return
    setTicketSheetOpen(false)
    router.push(
      `/checkout?eventId=${event._id}&tierId=${tierId}&qty=${qty}`,
    )
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
        }}
      >
        <LoadingSpinner size="lg" centered />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          padding: '24px',
        }}
      >
        <ErrorMessage
          message={error ?? 'Event not found'}
          onRetry={fetchEvent}
        />
      </div>
    )
  }

  const allImages = [
    ...(event.coverImage ? [event.coverImage] : []),
    ...event.images,
  ]

  const minPrice =
    event.ticketType.length > 0
      ? Math.min(...event.ticketType.map((t) => t.price))
      : 0

  const allSoldOut = event.ticketType.every(
    (t) => t.sold >= t.capacity,
  )

  const organizer = {
    _id: event.planner_id,
    name: event.planner,
    isPartner: false,
    isVerify: {} as { email?: boolean; photo?: boolean },
  }

  return (
    <>
      <AuthGateSheet
        isOpen={gateOpen}
        onClose={closeGate}
        trigger={gateTrigger}
        redirectTo={`/events/${event.slug ?? event._id}`}
      />

      <TicketTierSheet
        isOpen={ticketSheetOpen}
        onClose={() => setTicketSheetOpen(false)}
        tiers={event.ticketType}
        eventName={event.name}
        onCheckout={handleCheckout}
      />

      {/* Hero with transparent nav overlay */}
      <div ref={heroRef} style={{ position: 'relative' }}>
        <EventTransparentNav
          onBack={() => router.back()}
          onShare={handleShare}
          onGetTickets={() => setTicketSheetOpen(true)}
          allSoldOut={allSoldOut}
        />
        <EventHeroCarousel images={allImages} name={event.name} />
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '0 24px 100px',
        }}
      >
        <BackLink href="/" marginBottom={16}>Events</BackLink>

        {/* Event name */}
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--color-text)',
            lineHeight: 1.25,
            marginBottom: '16px',
          }}
        >
          {event.name}
        </h1>

        {/* Date + time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
            color: 'var(--color-text-muted)',
            fontSize: '14px',
          }}
        >
          <CalendarIcon />
          <span>
            {formatDate(event.date)} · {formatTime(event.startTime)}
            {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
          </span>
        </div>

        {/* Venue + address */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '18px',
            color: 'var(--color-text-muted)',
            fontSize: '14px',
          }}
        >
          <MapPinIcon />
          <span>
            {event.venue}
            {event.address ? `, ${event.address}` : ''}
            {event.state ? `, ${event.state}` : ''}
          </span>
        </div>

        {/* Like + Category row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Like button */}
          <button
            type="button"
            onClick={handleLike}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '99px',
              border: `1.5px solid ${isLiked ? 'var(--color-error)' : 'var(--color-border)'}`,
              background: isLiked ? 'rgba(239,68,68,0.06)' : 'var(--color-surface)',
              color: isLiked ? 'var(--color-error)' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'border-color 150ms, background 150ms, color 150ms',
            }}
            aria-pressed={isLiked}
            aria-label={isLiked ? 'Unlike event' : 'Like event'}
          >
            <HeartIcon filled={isLiked} />
            {(likeCount ?? 0) > 0 && <span>{(likeCount ?? 0).toLocaleString()}</span>}
          </button>

          {/* Category badge */}
          {event.category && (
            <span
              style={{
                padding: '6px 14px',
                borderRadius: '99px',
                background: 'rgba(124,58,237,0.08)',
                color: 'var(--color-brand)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {event.category}
            </span>
          )}
        </div>

        {/* Social proof bar */}
        <div style={{ marginBottom: '20px' }}>
          {event.sold > 0 ? (
            <p
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-brand)',
                margin: 0,
              }}
            >
              {event.sold.toLocaleString()} people going
            </p>
          ) : (
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-muted)',
                margin: 0,
              }}
            >
              Be the first!
            </p>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p
            style={{
              fontSize: '15px',
              color: 'var(--color-text)',
              lineHeight: 1.7,
              marginBottom: '24px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {event.description}
          </p>
        )}

        {/* Lineup */}
        {event.performers && event.performers.length > 0 && (
          <>
            <Divider />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 14px' }}>Lineup</h2>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {event.performers.map((p) => (
                <Link
                  key={p.name}
                  href={`/search?q=${encodeURIComponent(p.name)}`}
                  style={{ flexShrink: 0, textAlign: 'center', textDecoration: 'none', width: '72px' }}
                >
                  {p.photo ? (
                    <Image src={p.photo} alt={p.name} width={64} height={64} style={{ borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-brand)', color: '#ffffff', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                      {initials(p.name)}
                    </div>
                  )}
                  <p style={{ fontSize: '12px', color: 'var(--color-text)', margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Location */}
        <Divider />
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 12px' }}>Location</h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
          {[event.venue, event.address, event.state].filter(Boolean).join(', ')}
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: '🗺️ Open in Maps', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue, event.address, event.state].filter(Boolean).join(', '))}` },
            { label: '⚡ Bolt', href: `https://bolt.eu/en/?destination=${encodeURIComponent(event.address ?? event.venue)}` },
            { label: '🚗 Uber', href: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(event.address ?? event.venue)}` },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 14px', textDecoration: 'none', display: 'inline-block' }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Share + Hype Link row */}
        <Divider />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleShare}
            style={{ flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: '10px', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            {shareToast ? 'Link Copied ✓' : 'Share Event'}
          </button>
          <button
            type="button"
            onClick={handleHypeLink}
            disabled={hypeLinkLoading}
            style={{ flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: '10px', border: '1.5px solid var(--color-brand)', background: 'rgba(124,58,237,0.06)', fontSize: '14px', fontWeight: 600, color: 'var(--color-brand)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: hypeLinkLoading ? 0.7 : 1 }}
          >
            🔗 {hypeLinkLoading ? 'Getting link…' : 'Share Hype Link'}
          </button>
        </div>

        <Divider />

        {/* Organizer */}
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: '0 0 4px',
          }}
        >
          Organizer
        </h2>
        <OrganizerCard
          organizer={organizer}
          stats={orgStats ?? undefined}
          href={`/organizer/${event.planner_id}`}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          variant="inline"
        />

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <>
            <Divider />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 14px' }}>More like this</h2>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {relatedEvents.map(e => (
                <div key={e._id} style={{ flexShrink: 0, width: '220px' }}>
                  <EventCard event={e} href={`/events/${e.slug ?? e._id}`} isLiked={false} compact />
                </div>
              ))}
            </div>
          </>
        )}

        <Divider />

        {/* Comments */}
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: '0 0 16px',
          }}
        >
          Comments
        </h2>
        <CommentSection
          eventId={event._id}
          initialComments={comments}
          initialHasMore={hasMoreComments}
          organizerId={event.planner_id}
        />
      </div>

      {/* Sticky bottom bar */}
      <StickyBottomBar isVisible={!heroVisible}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            {allSoldOut ? (
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                }}
              >
                Sold Out
              </span>
            ) : (
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}
              >
                From {minPrice === 0 ? 'Free' : formatNaira(minPrice)}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={allSoldOut}
            onClick={() => setTicketSheetOpen(true)}
            style={{
              padding: '11px 28px',
              borderRadius: '10px',
              border: 'none',
              background: allSoldOut
                ? 'var(--color-border)'
                : 'var(--color-brand)',
              color: allSoldOut ? 'var(--color-text-muted)' : '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: allSoldOut ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            Get Tickets
          </button>
        </div>
      </StickyBottomBar>
    </>
  )
}

function Divider() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--color-border)',
        margin: '24px 0',
      }}
    />
  )
}
