'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { EventHeroCarousel } from '@/components/event/EventHeroCarousel'
import { EventTransparentNav } from '@/components/event/EventTransparentNav'
import { EventMeta } from '@/components/event/EventMeta'
import { EventLineup } from '@/components/event/EventLineup'
import { EventLocation } from '@/components/event/EventLocation'
import { EventShareRow } from '@/components/event/EventShareRow'
import { EventRelatedSection } from '@/components/event/EventRelatedSection'
import { EventMediaGallery } from '@/components/event/EventMediaGallery'
import { EventStickyBar } from '@/components/event/EventStickyBar'
import { TicketTierSheet } from '@/components/event/TicketTierSheet'
import { CommentSection, type Comment } from '@/components/event/CommentSection'
import { OrganizerCard, type OrganizerStats } from '@/components/ui/OrganizerCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { BackLink } from '@/components/ui/BackLink'
import { Divider } from '@/components/events/EventIcons'
import { useLike } from '@/hooks/useLike'
import { useAuthGate } from '@/hooks/useAuthGate'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { authHeader, formatNaira } from '@comfytag/utils'
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
        const cd = (await commentsRes.value.json()) as { comments: Comment[]; hasMore: boolean }
        setComments(cd.comments ?? [])
        setHasMoreComments(cd.hasMore ?? false)
      }
      if (followRes.status === 'fulfilled' && followRes.value.ok) {
        const fd = (await followRes.value.json()) as { following: boolean; followerCount: number }
        setIsFollowing(fd.following)
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        setOrgStats((await statsRes.value.json()) as OrganizerStats)
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

  useEffect(() => { fetchEvent() }, [fetchEvent])

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  async function handleLike() {
    if (!session) { openGate('like'); return }
    await toggleLike()
  }

  async function handleFollow() {
    if (!session) { openGate('like'); return }
    if (!event) return
    try {
      const res = await api.post<{ following: boolean; followerCount: number }>(
        `/organizers/${event.planner_id}/follow`, null, authHeader(session.user.token),
      )
      setIsFollowing(res.data.following)
      if (orgStats) setOrgStats({ ...orgStats, followerCount: res.data.followerCount })
    } catch { /* silent */ }
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
    } catch { /* silent */ }
    finally { setHypeLinkLoading(false) }
  }

  function handleCheckout(tierId: string, qty: number) {
    if (!event) return
    setTicketSheetOpen(false)
    router.push(`/checkout?eventId=${event._id}&tierId=${tierId}&qty=${qty}`)
  }

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <LoadingSpinner size="lg" centered />
    </div>
  )

  if (error || !event) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '24px' }}>
      <ErrorMessage message={error ?? 'Event not found'} onRetry={fetchEvent} />
    </div>
  )

  const allImages = [...(event.coverImage ? [event.coverImage] : []), ...event.images]
  const minPrice = event.ticketType.length > 0 ? Math.min(...event.ticketType.map(t => t.price)) : 0
  const allSoldOut = event.ticketType.every(t => t.sold >= t.capacity)
  const organizer = { _id: event.planner_id, name: event.planner, isPartner: false, isVerify: {} as { email?: boolean; photo?: boolean } }

  return (
    <>
      <AuthGateSheet isOpen={gateOpen} onClose={closeGate} trigger={gateTrigger} redirectTo={`/events/${event.slug ?? event._id}`} />
      <TicketTierSheet isOpen={ticketSheetOpen} onClose={() => setTicketSheetOpen(false)} tiers={event.ticketType} eventName={event.name} onCheckout={handleCheckout} />

      <div ref={heroRef} style={{ position: 'relative' }}>
        <EventTransparentNav onBack={() => router.back()} onShare={handleShare} onGetTickets={() => setTicketSheetOpen(true)} allSoldOut={allSoldOut} />
        <EventHeroCarousel images={allImages} name={event.name} />
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 100px' }}>
        <BackLink href="/events" marginBottom={16}>Events</BackLink>
        <EventMeta event={event} isLiked={isLiked} likeCount={likeCount ?? undefined} onLike={handleLike} />
        {allSoldOut ? (
          <div style={{
            padding: '13px 20px',
            borderRadius: '12px',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-muted)',
            fontSize: '15px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            Sold Out
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setTicketSheetOpen(true)}
            style={{
              width: '100%',
              padding: '13px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--color-brand)',
              color: 'var(--color-text-on-brand)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: '24px',
            }}
          >
            Get Tickets{minPrice > 0 ? ` — from ${formatNaira(minPrice)}` : ' — Free'}
          </button>
        )}
        <EventLineup performers={event.performers ?? []} />
        <Divider />
        <CommentSection eventId={event._id} initialComments={comments} initialHasMore={hasMoreComments} organizerId={event.planner_id} />
        <Divider />
        {event.description && (
          <p style={{ fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
            {event.description}
          </p>
        )}
        <EventMediaGallery event={event} />
        <EventLocation event={event} />
        <EventShareRow onShare={handleShare} onHypeLink={handleHypeLink} shareToast={shareToast} hypeLinkLoading={hypeLinkLoading} />
        <Divider />
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>Organizer</h2>
        <OrganizerCard organizer={organizer} stats={orgStats ?? undefined} href={`/organizer/${event.planner_id}`} isFollowing={isFollowing} onFollow={handleFollow} variant="inline" />
        <EventRelatedSection events={relatedEvents} />
      </div>

      <EventStickyBar isVisible={!heroVisible} minPrice={minPrice} allSoldOut={allSoldOut} onGetTickets={() => setTicketSheetOpen(true)} />
    </>
  )
}
