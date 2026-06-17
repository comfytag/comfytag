'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { EventHeroCarousel } from '@/components/event/EventHeroCarousel'
import { EventMeta } from '@/components/event/EventMeta'
import { EventShareRow } from '@/components/event/EventShareRow'
import { EventStickyBar } from '@/components/event/EventStickyBar'
import { TicketTierSheet } from '@/components/event/TicketTierSheet'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { BackLink } from '@/components/ui/BackLink'
import { CommentSection } from '@/components/event/CommentSection'
import { Divider } from '@/components/events/EventIcons'
import { useLike } from '@/hooks/useLike'
import { useAuthGate } from '@/hooks/useAuthGate'
import {
  calculatePlatformFee,
  calculatePaystackFee,
} from '@comfytag/utils'
import type { Event as EventType, TicketTier } from '@comfytag/types'
import type { Comment } from '@/components/event/CommentSection'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthModal } from '@/hooks/useAuthModal'

declare global {
  interface Window {
    PaystackPop: {
      setup(cfg: {
        key: string
        email: string
        amount: number
        ref: string
        currency: string
        firstname?: string
        onClose(): void
        callback(res: { reference: string }): void
      }): { openIframe(): void }
    }
  }
}

type DirectCheckoutState = 'idle' | 'processing' | 'verifying'

interface EventInteractiveSectionProps {
  event: EventType
  initialComments: Comment[]
  initialHasMore: boolean
  relatedEvents: EventType[]
  children?: React.ReactNode
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function EventInteractiveSection({
  event,
  initialComments,
  initialHasMore,
  children,
}: EventInteractiveSectionProps) {
  const router = useRouter()
  const { data: session } = useSession()

  const [ticketSheetOpen, setTicketSheetOpen] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [hypeLinkLoading, setHypeLinkLoading] = useState(false)
  const [directCheckoutState, setDirectCheckoutState] = useState<DirectCheckoutState>('idle')

  // Preload Paystack inline.js so it's ready when a logged-in user hits "Get Tickets"
  useEffect(() => {
    if (!session) return
    if (document.querySelector('script[src*="paystack"]')) return
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    document.head.appendChild(s)
    return () => {
      if (document.head.contains(s)) document.head.removeChild(s)
    }
  }, [session])

  const { openModal } = useAuthModal()
  const { isLiked, likeCount, toggleLike } = useLike(event._id, false, event.sold)
  const { gateOpen, gateTrigger, openGate, closeGate } = useAuthGate()

  const handleLike = async () => {
    if (!session) { openGate('like'); return }
    await toggleLike()
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
    if (!session) { openGate('hype-link'); return }
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
    } catch { /* silent */ }
    finally { setHypeLinkLoading(false) }
  }

  const handleDirectCheckout = async (tierId: string, qty: number) => {
    if (!session) return
    const tier = event.ticketType.find((t: TicketTier) => t._id === tierId)
    if (!tier) return

    setDirectCheckoutState('processing')

    const userEmail = session.user.email ?? ''
    const userName = session.user.name ?? ''
    const userId = session.user.id

    if (tier.price === 0) {
      const ref = `FREE_${Date.now()}`
      try {
        await api.post(`/audience/free/${event._id}`, {
          name: userName,
          email: userEmail,
          phone: undefined,
          eventname: event.name,
          numOfTicket: qty,
          type: tier.name,
          userId,
        })
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200])
        router.push(
          `/checkout/success?ref=${ref}&eventId=${encodeURIComponent(event._id)}&eventName=${encodeURIComponent(event.name)}&contactInfo=${encodeURIComponent(userEmail)}`,
        )
      } catch {
        setDirectCheckoutState('idle')
      }
      return
    }

    // Paid ticket — initiate Paystack directly
    if (!window.PaystackPop) {
      // Script not ready yet; fall back to checkout page
      setDirectCheckoutState('idle')
      router.push(`/checkout?eventId=${event._id}&tierId=${tierId}&qty=${qty}`)
      return
    }

    const subtotal = tier.price * qty
    const platformFee = calculatePlatformFee(subtotal, 4)
    const processingFee = calculatePaystackFee(subtotal)
    const total = subtotal + platformFee + processingFee
    const ref = `CT_${Date.now()}`

    window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? '',
      email: userEmail,
      amount: total * 100,
      ref,
      currency: 'NGN',
      firstname: userName.split(' ')[0],
      onClose() {
        setDirectCheckoutState('idle')
      },
      async callback(res: { reference: string }) {
        setDirectCheckoutState('verifying')
        try {
          await api.post(`/paystack/verify/${res.reference}`)
          await api.post(`/audience/${userId}/${event._id}`, {
            name: userName,
            email: userEmail,
            phone: '',
            eventname: event.name,
            numOfTicket: qty,
            type: tier.name,
            amount: total,
            reference: res.reference,
            status: 'active',
          })
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200])
          router.push(
            `/checkout/success?ref=${res.reference}&eventId=${encodeURIComponent(event._id)}&eventName=${encodeURIComponent(event.name)}&contactInfo=${encodeURIComponent(userEmail)}`,
          )
        } catch {
          setDirectCheckoutState('idle')
        }
      },
    }).openIframe()
  }

  const handleCheckout = (tierId: string, qty: number) => {
    setTicketSheetOpen(false)
    if (!session) {
      // Unauthenticated: open auth modal instead of navigating away.
      // After silent close the user stays on the event page, now signed in.
      openModal('login')
      return
    }
    handleDirectCheckout(tierId, qty)
  }

  const allImages = [
    ...(event.coverImage ? [event.coverImage] : []),
    ...event.images,
  ]
  const minPrice =
    event.ticketType.length > 0
      ? Math.min(...event.ticketType.map((t) => t.price))
      : 0
  const allSoldOut =
    event.ticketType.length > 0 &&
    event.ticketType.every((t) => t.capacity > 0 && t.sold >= t.capacity)

  const displayEvent = { ...event, name: toTitleCase(event.name) }

  return (
    <>
      <Navbar />

      {/* Full-screen overlay while direct checkout processes */}
      {directCheckoutState !== 'idle' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
          aria-live="polite"
        >
          <style>{`@keyframes __ct_spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ animation: '__ct_spin 0.8s linear infinite' }}
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', margin: 0, fontWeight: 500 }}>
            {directCheckoutState === 'verifying' ? 'Confirming your ticket…' : 'Processing your payment…'}
          </p>
        </div>
      )}

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

      {/* Page canvas */}
      <div className="min-h-screen bg-slate-50 text-zinc-900 pb-32 font-sans">
        {/* Back nav */}
        <div className="max-w-md mx-auto px-4 pt-4">
          <BackLink href="/events" marginBottom={16}>Events</BackLink>
        </div>

        {/* Hero image — portrait on mobile, square on sm+ */}
        <div
          className="w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-md border border-zinc-200/50 mt-4"
          data-testid="event-hero"
        >
          <EventHeroCarousel images={allImages} name={event.name} />
        </div>

        {/* Content column */}
        <div className="max-w-md mx-auto px-4 py-6 space-y-8">
          <EventMeta
            event={displayEvent}
            isLiked={isLiked}
            likeCount={likeCount ?? undefined}
            onLike={handleLike}
          />

          {/* RSC-slotted children: lineup, description, media, location, organizer, related */}
          {children}

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
        </div>
      </div>

      {/* Sticky bottom CTA — all screen sizes */}
      <EventStickyBar
        isVisible={true}
        minPrice={minPrice}
        allSoldOut={allSoldOut}
        onGetTickets={() => setTicketSheetOpen(true)}
      />
    </>
  )
}
