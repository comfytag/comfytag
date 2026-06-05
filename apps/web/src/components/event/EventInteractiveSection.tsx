'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EventTransparentNav } from '@/components/event/EventTransparentNav'
import { EventHeroCarousel } from '@/components/event/EventHeroCarousel'
import { EventMeta } from '@/components/event/EventMeta'
import { EventShareRow } from '@/components/event/EventShareRow'
import { EventStickyBar } from '@/components/event/EventStickyBar'
import { TicketTierSheet } from '@/components/event/TicketTierSheet'
import { OrganizerCard } from '@/components/ui/OrganizerCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { Divider } from '@/components/events/EventIcons'
import { BackLink } from '@/components/ui/BackLink'
import { CommentSection } from '@/components/event/CommentSection'
import { useLike } from '@/hooks/useLike'
import { useAuthGate } from '@/hooks/useAuthGate'
import { Button } from '@comfytag/ui'
import { formatNaira } from '@comfytag/utils'
import type { Event as EventType, TicketTier } from '@comfytag/types'
import type { Comment } from '@/components/event/CommentSection'
import { api } from '@/lib/api'

interface EventInteractiveSectionProps {
  event: EventType
  initialComments: Comment[]
  initialHasMore: boolean
  relatedEvents: EventType[]
  children?: React.ReactNode
}

export function EventInteractiveSection({
  event,
  initialComments,
  initialHasMore,
  relatedEvents,
  children,
}: EventInteractiveSectionProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // State
  const [ticketSheetOpen, setTicketSheetOpen] = useState(false)
  const [heroVisible, setHeroVisible] = useState(true)
  const [shareToast, setShareToast] = useState(false)
  const [hypeLinkLoading, setHypeLinkLoading] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver for hero visibility
  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Follow status query (auth-gated, only fetches when user logged in)
  const { data: followData } = useQuery({
    queryKey: ['follow-status', event.planner_id],
    queryFn: async () => {
      if (!session?.user?.token) return { following: false, followerCount: 0 }
      try {
        const res = await api.get<{ following: boolean; followerCount: number }>(
          `/organizers/${event.planner_id}/follow/status`
        )
        return res.data
      } catch {
        return { following: false, followerCount: 0 }
      }
    },
    enabled: !!session?.user?.token,
  })

  // Organizer stats query (public)
  const { data: orgStats } = useQuery({
    queryKey: ['org-stats', event.planner_id],
    queryFn: async () => {
      const res = await api.get<{
        followerCount: number
        eventCount: number
        totalTicketsSold: number
      }>(`/organizers/${event.planner_id}/stats`)
      return res.data
    },
  })

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.token) throw new Error('Not authenticated')
      const res = await api.post<{ following: boolean; followerCount: number }>(
        `/organizers/${event.planner_id}/follow`
      )
      return res.data
    },
    onSuccess: (data: { following: boolean; followerCount: number }) => {
      queryClient.setQueryData(
        ['follow-status', event.planner_id],
        { following: data.following, followerCount: data.followerCount }
      )
      if (orgStats) {
        queryClient.setQueryData(
          ['org-stats', event.planner_id],
          {
            ...orgStats,
            followerCount: data.followerCount,
          }
        )
      }
    },
  })

  // Like state
  const { isLiked, likeCount, toggleLike } = useLike(event._id, false, event.sold)

  // Auth gate
  const { gateOpen, gateTrigger, openGate, closeGate } = useAuthGate()

  // Handlers
  const handleLike = async () => {
    if (!session) {
      openGate('like')
      return
    }
    await toggleLike()
  }

  const handleFollow = () => {
    if (!session) {
      openGate('like')
      return
    }
    followMutation.mutate()
  }

  const handleShare = async () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.slug ?? event._id}`
    if (navigator.share) {
      await navigator.share({ title: event.name, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    }
  }

  const handleHypeLink = async () => {
    if (!session) {
      openGate('hype-link')
      return
    }
    setHypeLinkLoading(true)
    try {
      const r = await api.get<Record<string, unknown>>(`/referral/${event._id}`)
      const json = r.data
      const refUrl: string =
        (json.url as string) ||
        (json.referralUrl as string) ||
        `${window.location.origin}/events/${event.slug ?? event._id}?ref=${session.user.id}`
      const text = `Omo, you dey go ${event.name}? 🔥 Use my link:`
      if (navigator.share) {
        await navigator.share({ title: event.name, text, url: refUrl }).catch(() => {})
      } else {
        await navigator.clipboard.writeText(refUrl).catch(() => {})
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
      }
    } catch {
      /* silent */
    } finally {
      setHypeLinkLoading(false)
    }
  }

  const handleCheckout = (tierId: string, qty: number) => {
    setTicketSheetOpen(false)
    router.push(`/checkout?eventId=${event._id}&tierId=${tierId}&qty=${qty}`)
  }

  // Computed
  const allImages = [
    ...(event.coverImage ? [event.coverImage] : []),
    ...event.images,
  ]
  const minPrice =
    event.ticketType.length > 0
      ? Math.min(...event.ticketType.map((t) => t.price))
      : 0
  const allSoldOut = event.ticketType.every((t) => t.sold >= t.capacity)
  const isFollowing = followData?.following ?? false
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

      {/* Hero section */}
      <div ref={heroRef} style={{ position: 'relative' }} data-testid="event-hero">
        <EventTransparentNav
          onBack={() => router.back()}
          onShare={handleShare}
          onGetTickets={() => setTicketSheetOpen(true)}
          allSoldOut={allSoldOut}
        />
        <EventHeroCarousel images={allImages} name={event.name} />
      </div>

      {/* Content area */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 100px' }}>
        <BackLink href="/events" marginBottom={16}>
          Events
        </BackLink>

        <EventMeta
          event={event}
          isLiked={isLiked}
          likeCount={likeCount ?? undefined}
          onLike={handleLike}
        />

        {/* Get Tickets / Sold Out */}
        {allSoldOut ? (
          <div
            style={{
              padding: '13px 20px',
              borderRadius: '12px',
              background: 'var(--color-surface-2)',
              color: 'var(--color-text-muted)',
              fontSize: '15px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            Sold Out
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }} data-testid="event-cta">
            <Button
              variant="primary"
              fullWidth
              onClick={() => setTicketSheetOpen(true)}
            >
              {`Get Tickets${minPrice > 0 ? ` — from ${formatNaira(minPrice)}` : ' — Free'}`}
            </Button>
          </div>
        )}

        {/* Static slotted children from RSC */}
        {children}

        {/* CommentSection */}
        <Divider />
        <CommentSection
          eventId={event._id}
          initialComments={initialComments}
          initialHasMore={initialHasMore}
          organizerId={event.planner_id}
        />

        <EventShareRow
          onShare={handleShare}
          onHypeLink={handleHypeLink}
          shareToast={shareToast}
          hypeLinkLoading={hypeLinkLoading}
        />

        <Divider />
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
      </div>

      {/* Sticky bar */}
      <EventStickyBar
        isVisible={!heroVisible}
        minPrice={minPrice}
        allSoldOut={allSoldOut}
        onGetTickets={() => setTicketSheetOpen(true)}
      />
    </>
  )
}
