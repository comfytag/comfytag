'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { EventHeroCarousel } from '@/components/event/EventHeroCarousel'
import { EventTransparentNav } from '@/components/event/EventTransparentNav'
import { EventShareRow } from '@/components/event/EventShareRow'
import { EventStickyBar } from '@/components/event/EventStickyBar'
import { TicketTierSheet } from '@/components/event/TicketTierSheet'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { BackLink } from '@/components/ui/BackLink'
import { CommentSection } from '@/components/event/CommentSection'
import { CalendarIcon, MapPinIcon, HeartIcon } from '@/components/events/EventIcons'
import { useLikeEvent, useLikeStatus } from '@/hooks/useEvents'
import { useAuthGate } from '@/hooks/useAuthGate'
import {
  formatNaira,
  formatDate,
  formatTime,
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

const MAX_TICKETS_PER_ORDER = 10

function isSoldOut(tier: TicketTier): boolean {
  return tier.capacity > 0 && tier.sold >= tier.capacity
}

function availableCount(tier: TicketTier): number {
  return Math.max(0, tier.capacity - tier.sold)
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// Builds a Google Calendar "add event" link from the event's date/time fields —
// a real, working feature that needs no backend support.
function toGCalDateTime(dateStr: string, timeStr?: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  let hours = 0
  let minutes = 0
  if (timeStr) {
    const t = new Date(`1970-01-01 ${timeStr.trim()}`)
    if (!isNaN(t.getTime())) {
      hours = t.getHours()
      minutes = t.getMinutes()
    }
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  return `${y}${m}${d}T${hh}${mm}00`
}

function buildGoogleCalendarUrl(event: EventType, fullAddress: string): string {
  const dateSource = event.date || event.event_date || ''
  const start = toGCalDateTime(dateSource, event.startTime)
  if (!start) return ''
  const end = event.endTime ? toGCalDateTime(dateSource, event.endTime) : start
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${start}/${end}`,
    details: event.headline ?? (event.description ? event.description.slice(0, 200) : ''),
    location: fullAddress,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

interface EventInteractiveSectionProps {
  event: EventType
  initialComments: Comment[]
  initialHasMore: boolean
  relatedEvents: EventType[]
  children?: React.ReactNode
}

// ── Local presentational cards (mockup: Date / Venue 2-up info cards) ──────

function DateInfoCard({ event }: { event: EventType }) {
  const calendarUrl = buildGoogleCalendarUrl(
    event,
    [event.venue, event.address, event.state].filter(Boolean).join(', '),
  )
  return (
    <div className="p-5 bg-(--color-surface) rounded-xl border border-(--color-border)">
      <div className="w-10 h-10 rounded-full bg-(--color-brand-alpha-8) text-brand flex items-center justify-center mb-3">
        <CalendarIcon />
      </div>
      <p className="text-lg font-bold text-(--color-text) mb-0.5">
        {formatDate(event.date || event.event_date)}
      </p>
      <p className="text-sm text-(--color-text-muted) mb-3">
        {formatTime(event.startTime)}
        {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
      </p>
      {calendarUrl && (
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand hover:underline"
        >
          Add to calendar
        </a>
      )}
    </div>
  )
}

function VenueInfoCard({ event, fullAddress }: { event: EventType; fullAddress: string }) {
  const destination = event.address ?? event.venue
  const rideLinks = [
    { label: 'View on map', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}` },
    { label: '⚡ Bolt', href: `https://bolt.eu/en/?destination=${encodeURIComponent(destination)}` },
    { label: '🚗 Uber', href: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(destination)}` },
  ]
  return (
    <div className="p-5 bg-(--color-surface) rounded-xl border border-(--color-border)">
      <div className="w-10 h-10 rounded-full bg-(--color-surface-2) text-(--color-text) flex items-center justify-center mb-3">
        <MapPinIcon />
      </div>
      <p className="text-lg font-bold text-(--color-text) mb-0.5 capitalize">{event.venue}</p>
      <p className="text-sm text-(--color-text-muted) mb-3 capitalize leading-relaxed">{fullAddress}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {rideLinks.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-brand hover:underline"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
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

  // Desktop inline ticket selection state
  const firstAvailable = event.ticketType.find((t: TicketTier) => !isSoldOut(t))
  const [desktopSelectedId, setDesktopSelectedId] = useState<string>(firstAvailable?._id ?? '')
  const [desktopQty, setDesktopQty] = useState(1)

  const isPast = new Date(event.date || event.event_date || '') < new Date()

  const desktopSelectedTier = event.ticketType.find((t: TicketTier) => t._id === desktopSelectedId)
  const desktopMaxQty = desktopSelectedTier
    ? Math.min(availableCount(desktopSelectedTier), MAX_TICKETS_PER_ORDER)
    : 1

  useEffect(() => {
    setDesktopQty((prev) => Math.min(prev, Math.max(desktopMaxQty, 1)))
  }, [desktopMaxQty])

  // Preload Paystack inline.js so it's ready when a logged-in user hits "Buy Ticket"
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
  const { data: likeStatus } = useLikeStatus(event._id)
  const { mutate: likeEvent } = useLikeEvent()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(event.likes ?? 0)
  const { gateOpen, gateTrigger, openGate, closeGate } = useAuthGate()

  // Hydrate real liked/count from the server once the status request resolves —
  // without this the button always shows "not liked" on every fresh page load.
  useEffect(() => {
    if (!likeStatus) return
    setIsLiked(likeStatus.liked)
    setLikeCount(likeStatus.likeCount)
  }, [likeStatus])

  const handleLike = () => {
    if (!session) { openGate('like'); return }
    const wasLiked = isLiked
    const prevCount = likeCount
    setIsLiked(!wasLiked)
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1))
    likeEvent(
      { eventId: event._id, slug: event.slug ?? event._id },
      {
        onError: () => {
          setIsLiked(wasLiked)
          setLikeCount(prevCount)
        },
      },
    )
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
    if (isPast) return
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

    if (!window.PaystackPop) {
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
      openModal('login')
      return
    }
    handleDirectCheckout(tierId, qty)
  }

  const handleDesktopCheckout = () => {
    if (!desktopSelectedTier) return
    if (!session) {
      openModal('login')
      return
    }
    handleDirectCheckout(desktopSelectedTier._id, desktopQty)
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
  const totalAvailable = event.ticketType.reduce((sum, t) => sum + availableCount(t), 0)

  const displayEvent = { ...event, name: toTitleCase(event.name) }
  const fullAddress = [event.venue, event.address, event.state].filter(Boolean).join(', ')

  const desktopSubtotal = desktopSelectedTier ? desktopSelectedTier.price * desktopQty : 0
  const desktopTotal = desktopSubtotal > 0
    ? desktopSubtotal + calculatePlatformFee(desktopSubtotal, 4) + calculatePaystackFee(desktopSubtotal)
    : 0

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
            background: 'rgba(255,255,255,0.97)',
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
        isPast={isPast}
      />

      <div className="min-h-screen bg-(--color-bg) text-(--color-text)">

        {/* ── Full-bleed hero ──────────────────────────────────────── */}
        <div className="relative w-full h-85 sm:h-105 md:h-120">
          <div className="absolute inset-0 [&>div]:h-full">
            <EventHeroCarousel
              images={allImages}
              name={event.name}
              containerClassName="relative w-full h-full bg-[#09090b] overflow-hidden"
              dotsOverlay
            />
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
          <EventTransparentNav onBack={() => router.push('/events')} onShare={handleShare} />
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 md:p-10">
            <div className="max-w-7xl mx-auto">
              {event.category && (
                <span className="inline-block px-3 py-1 rounded-full bg-brand text-white text-xs font-bold uppercase tracking-wide mb-3">
                  {event.category}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight max-w-3xl capitalize">
                {displayEvent.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

          <div className="mb-6">
            <BackLink href="/events" marginBottom={0}>Events</BackLink>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* ── LEFT COLUMN ────────────────────────────────────── */}
            <div className="lg:col-span-7">

              {event.headline && (
                <p className="text-lg text-(--color-text-muted) mb-6 leading-relaxed">
                  {event.headline}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <button
                  type="button"
                  onClick={handleLike}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? 'Unlike event' : 'Like event'}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-semibold transition-all duration-150 ${
                    isLiked
                      ? 'border-error text-error'
                      : 'border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:border-brand'
                  }`}
                >
                  <HeartIcon filled={isLiked} />
                  {(likeCount ?? 0) > 0 && <span>{(likeCount ?? 0).toLocaleString()}</span>}
                </button>

                {event.sold > 0 ? (
                  <span className="text-sm font-semibold text-brand">
                    {event.sold.toLocaleString()} people going
                  </span>
                ) : (
                  <span className="text-sm text-(--color-text-muted)">Be the first!</span>
                )}
              </div>

              {/* Date / Venue info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <DateInfoCard event={event} />
                <VenueInfoCard event={event} fullAddress={fullAddress} />
              </div>

              {/* RSC children: About this event, Lineup, Media gallery, Organizer, Related */}
              <div className="space-y-10">
                {children}
              </div>

              <div className="mt-10">
                <CommentSection
                  eventId={event._id}
                  initialComments={initialComments}
                  initialHasMore={initialHasMore}
                  organizerId={event.planner_id}
                />
              </div>

              <EventShareRow
                onShare={handleShare}
                onHypeLink={handleHypeLink}
                shareToast={shareToast}
                hypeLinkLoading={hypeLinkLoading}
              />

              {/* Spacer so mobile sticky bar doesn't overlap last content */}
              <div className="h-48 lg:hidden" aria-hidden="true" />
            </div>

            {/* ── RIGHT COLUMN: Sticky Tickets card ────────────────── */}
            <div className="hidden md:block lg:col-span-5">
              <div className="sticky top-24">
                <div className="bg-(--color-surface) rounded-2xl border border-(--color-border) p-6 sm:p-8">

                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-(--color-text)">Tickets</h2>
                    {!allSoldOut && event.ticketType.length > 0 && (
                      <span className="text-xs font-semibold text-(--color-text-muted)">
                        {totalAvailable.toLocaleString()} left
                      </span>
                    )}
                  </div>

                  {event.ticketType.length === 0 ? (
                    <p className="text-sm text-(--color-text-muted) text-center py-4">No tickets available</p>
                  ) : (
                    <>
                      {/* Tier radio-cards */}
                      <div className="space-y-3 mb-6">
                        {event.ticketType.map((tier: TicketTier) => {
                          const soldOut = isSoldOut(tier)
                          const selected = tier._id === desktopSelectedId
                          return (
                            <button
                              key={tier._id}
                              type="button"
                              disabled={soldOut}
                              onClick={() => {
                                if (!soldOut) {
                                  setDesktopSelectedId(tier._id)
                                  setDesktopQty(1)
                                }
                              }}
                              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                                selected
                                  ? 'border-brand bg-(--color-brand-alpha-8)'
                                  : soldOut
                                  ? 'border-(--color-border) bg-(--color-surface-2) opacity-60 cursor-not-allowed'
                                  : 'border-(--color-border) hover:border-brand cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                    selected ? 'border-brand bg-brand' : 'border-(--color-border)'
                                  }`}
                                >
                                  {selected && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </span>
                                <span className={`text-sm font-semibold truncate ${soldOut ? 'text-(--color-text-muted)' : 'text-(--color-text)'}`}>
                                  {tier.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-sm font-bold ${soldOut ? 'text-(--color-text-muted)' : 'text-(--color-text)'}`}>
                                  {tier.price === 0 ? 'Free' : formatNaira(tier.price)}
                                </span>
                                {soldOut ? (
                                  <span className="text-[10px] font-semibold bg-(--color-surface-2) text-(--color-text-muted) px-2 py-0.5 rounded-full">Sold Out</span>
                                ) : (
                                  <span className="text-[10px] text-(--color-text-muted)">{availableCount(tier)} left</span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* Quantity stepper */}
                      {desktopSelectedTier && !isSoldOut(desktopSelectedTier) && (
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-(--color-border)">
                          <span className="text-sm font-medium text-(--color-text-muted)">Quantity</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setDesktopQty((prev) => Math.max(1, prev - 1))}
                              disabled={desktopQty <= 1}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 rounded-full border border-(--color-border) bg-(--color-surface) flex items-center justify-center text-(--color-text) hover:bg-(--color-surface-2) disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                            <span className="text-base font-bold text-(--color-text) min-w-5 text-center tabular-nums">
                              {desktopQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDesktopQty((prev) => Math.min(desktopMaxQty, prev + 1))}
                              disabled={desktopQty >= desktopMaxQty}
                              aria-label="Increase quantity"
                              className="w-8 h-8 rounded-full border border-(--color-border) bg-(--color-surface) flex items-center justify-center text-(--color-text) hover:bg-(--color-surface-2) disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Price breakdown */}
                      {desktopSelectedTier && desktopSelectedTier.price > 0 && (
                        <div className="space-y-2 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-(--color-text-muted)">Subtotal</span>
                            <span className="text-(--color-text) font-medium">{formatNaira(desktopSubtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-(--color-text-muted)">Service Fee</span>
                            <span className="text-(--color-text) font-medium">{formatNaira(desktopTotal - desktopSubtotal)}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold pt-2 border-t border-(--color-border)">
                            <span className="text-(--color-text)">Total</span>
                            <span className="text-(--color-text)">{formatNaira(desktopTotal)}</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={allSoldOut || isPast}
                        onClick={handleDesktopCheckout}
                        className="w-full bg-brand text-white font-bold uppercase tracking-wide text-sm py-4 rounded-full active:scale-95 transition-all disabled:bg-(--color-surface-2) disabled:text-(--color-text-muted) disabled:cursor-not-allowed"
                      >
                        {isPast ? 'Ended' : allSoldOut ? 'Sold Out' : 'Buy Ticket'}
                      </button>

                      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-(--color-text-muted)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 12 15 15 9" />
                        </svg>
                        <span>Secured by Paystack</span>
                      </div>

                      {(event.startTime || event.endTime) && (
                        <p className="text-center text-xs text-(--color-text-muted) mt-3">
                          Gates{event.startTime ? ` open ${formatTime(event.startTime)}` : ''}
                          {event.endTime ? ` · close ${formatTime(event.endTime)}` : ''}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* ── END RIGHT COLUMN ─────────────────────────────────── */}

          </div>
        </div>
      </div>

      {/* Sticky bottom CTA — mobile only (lg:hidden is on EventStickyBar itself) */}
      <EventStickyBar
        isVisible={true}
        minPrice={minPrice}
        allSoldOut={allSoldOut}
        isPast={isPast}
        onGetTickets={() => setTicketSheetOpen(true)}
      />
    </>
  )
}
