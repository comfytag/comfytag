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
import { CalendarIcon, MapPinIcon, Divider } from '@/components/events/EventIcons'
import { useLike } from '@/hooks/useLike'
import { useAuthGate } from '@/hooks/useAuthGate'
import {
  formatDate,
  formatTime,
  formatNaira,
  calculatePlatformFee,
  calculatePaystackFee,
} from '@comfytag/utils'
import type { Event as EventType, TicketTier } from '@comfytag/types'
import type { Comment } from '@/components/event/CommentSection'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'

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
    if (session) {
      handleDirectCheckout(tierId, qty)
    } else {
      router.push(`/checkout?eventId=${event._id}&tierId=${tierId}&qty=${qty}`)
    }
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

      {/* Main canvas */}
      <div className="w-full min-h-screen bg-zinc-50/30 pt-8 pb-16 max-w-7xl mx-auto px-4 md:px-8">
        <BackLink href="/events" marginBottom={16}>Events</BackLink>

        {/* Above-the-fold premium image frame */}
        <div
          className="w-full h-75 md:h-112.5 rounded-3xl overflow-hidden relative shadow-sm mb-8 bg-zinc-950"
          data-testid="event-hero"
        >
          <EventHeroCarousel images={allImages} name={event.name} />
        </div>

        {/* Desktop 2-column split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Left: main content column */}
          <div className="lg:col-span-2">
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

          {/* Right: sticky purchase widget — desktop only */}
          <div className="hidden lg:block sticky top-28 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
            {/* Price display */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                Tickets from
              </p>
              <p className="text-3xl font-extrabold text-zinc-900">
                {minPrice > 0 ? formatNaira(minPrice) : 'Free'}
              </p>
            </div>

            {/* Primary action */}
            {allSoldOut ? (
              <div className="w-full py-4 text-center font-bold text-zinc-400 bg-zinc-100 rounded-xl">
                Sold Out
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTicketSheetOpen(true)}
                data-testid="event-cta"
                className="w-full py-4 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-center"
              >
                Get Tickets
              </button>
            )}

            {/* Event quick-summary */}
            <div className="mt-6 pt-5 border-t border-zinc-100 space-y-3">
              <div className="flex items-start gap-3 text-sm text-zinc-600">
                <span
                  className="shrink-0 mt-0.5 text-zinc-400"
                  style={{ display: 'inline-flex', width: 16, height: 16 }}
                >
                  <CalendarIcon />
                </span>
                <span>
                  {formatDate(event.date)}
                  {event.startTime ? ` · ${formatTime(event.startTime)}` : ''}
                  {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm text-zinc-600">
                <span
                  className="shrink-0 mt-0.5 text-zinc-400"
                  style={{ display: 'inline-flex', width: 16, height: 16 }}
                >
                  <MapPinIcon />
                </span>
                <span>
                  {event.venue}
                  {event.state ? `, ${event.state}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: fixed bottom CTA drawer — hidden on desktop where sidebar handles checkout */}
      <div className="lg:hidden">
        <EventStickyBar
          isVisible={true}
          minPrice={minPrice}
          allSoldOut={allSoldOut}
          onGetTickets={() => setTicketSheetOpen(true)}
        />
      </div>
    </>
  )
}
