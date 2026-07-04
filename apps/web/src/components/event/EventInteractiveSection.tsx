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
import { useLikeEvent, useLikeStatus } from '@/hooks/useEvents'
import { useAuthGate } from '@/hooks/useAuthGate'
import {
  formatNaira,
  calculatePlatformFee,
  calculatePaystackFee,
  formatTime,
} from '@comfytag/utils'
import type { Event as EventType, TicketTier } from '@comfytag/types'
import type { Comment } from '@/components/event/CommentSection'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { useAuthModal } from '@/hooks/useAuthModal'
import Image from 'next/image'

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

interface OrganizerMini {
  _id: string
  name: string
  image?: string
  username?: string
}

interface EventInteractiveSectionProps {
  event: EventType
  initialComments: Comment[]
  initialHasMore: boolean
  relatedEvents: EventType[]
  organizer?: OrganizerMini | null
  children?: React.ReactNode
}

export function EventInteractiveSection({
  event,
  initialComments,
  initialHasMore,
  organizer,
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

  const displayEvent = { ...event, name: toTitleCase(event.name) }
  const fullAddress = [event.venue, event.address, event.state].filter(Boolean).join(', ')

  const desktopSubtotal = desktopSelectedTier ? desktopSelectedTier.price * desktopQty : 0
  const desktopTotal = desktopSubtotal > 0
    ? desktopSubtotal + calculatePlatformFee(desktopSubtotal, 4) + calculatePaystackFee(desktopSubtotal)
    : 0

  const organizerHref = organizer
    ? `/organizer/${organizer.username && !organizer.username.includes('@') ? organizer.username : organizer._id}`
    : '#'

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
        isPast={isPast}
      />

      {/* Page canvas */}
      <div className="min-h-screen bg-slate-50 text-zinc-900 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

          {/* Back nav */}
          <div className="mb-6">
            <BackLink href="/events" marginBottom={0}>Events</BackLink>
          </div>

          {/* Two-column responsive grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* ── LEFT COLUMN: Hero + Content ─────────────────── */}
            <div className="lg:col-span-7">

              {/* Hero image carousel */}
              <div
                className="w-full rounded-[2rem] overflow-hidden shadow-sm border border-zinc-200/50 mb-8"
                data-testid="event-hero"
              >
                <EventHeroCarousel
                  images={allImages}
                  name={event.name}
                  containerClassName="relative w-full aspect-[4/5] sm:aspect-video lg:aspect-[4/3] bg-[#09090b] overflow-hidden touch-pan-y"
                />
              </div>

              {/* Event title, date, venue, like */}
              <EventMeta
                event={displayEvent}
                isLiked={isLiked}
                likeCount={likeCount ?? undefined}
                onLike={handleLike}
              />

              {/* RSC children: lineup, description, media, location, organizer, related */}
              <div className="space-y-8 mt-8">
                {children}
              </div>

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

              {/* Spacer so mobile sticky bar doesn't overlap last content */}
              <div className="h-48 lg:hidden" aria-hidden="true" />
            </div>

            {/* ── RIGHT COLUMN: Sticky Ticketing Hub ───────────── */}
            <div className="hidden md:block lg:col-span-5">
              <div className="sticky top-24 space-y-6">

                {/* Gate Access Card — boarding pass style */}
                <div className="bg-white rounded-[2rem] border border-zinc-200/80 p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-full shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <h2 className="text-base font-bold text-zinc-900">Gate Access</h2>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    {event.startTime && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Gates Open</p>
                        <p className="text-sm font-semibold text-zinc-900">{formatTime(event.startTime)}</p>
                      </div>
                    )}
                    {event.endTime && (
                      <div className="text-right">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">Gates Close</p>
                        <p className="text-sm font-semibold text-zinc-900">{formatTime(event.endTime)}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    <p className="text-sm text-zinc-500 leading-relaxed capitalize">{fullAddress}</p>
                  </div>
                </div>

                {/* Ticket Selection Card */}
                <div className="bg-white rounded-[2rem] border border-zinc-200/80 p-4 sm:p-5 shadow-sm">
                  {event.ticketType.length === 0 ? (
                    <p className="text-sm text-zinc-400 text-center py-4">No tickets available</p>
                  ) : (
                    <>
                      {/* Tier selector */}
                      {event.ticketType.length > 1 && (
                        <div className="space-y-2 mb-4">
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
                                className={`w-full text-left px-4 py-3 rounded-2xl border-[1.5px] transition-all ${
                                  selected
                                    ? 'border-violet-400 bg-violet-50/60'
                                    : soldOut
                                    ? 'border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed'
                                    : 'border-zinc-200 hover:border-zinc-300 bg-white cursor-pointer'
                                }`}
                              >
                                <div className="flex justify-between items-center gap-2">
                                  <span className={`text-sm font-semibold ${soldOut ? 'text-zinc-400' : 'text-zinc-900'}`}>
                                    {tier.name}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-sm font-bold ${soldOut ? 'text-zinc-400' : 'text-zinc-900'}`}>
                                      {tier.price === 0 ? 'Free' : formatNaira(tier.price)}
                                    </span>
                                    {soldOut && (
                                      <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full">Sold Out</span>
                                    )}
                                    {!soldOut && (
                                      <span className="text-[10px] text-zinc-400">{availableCount(tier)} left</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Ticket name/price (left) + Quantity selector (right) — single horizontal row */}
                      {desktopSelectedTier && (
                        <div className="flex justify-between items-center gap-3 mb-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-700 truncate">{desktopSelectedTier.name}</p>
                            <p className="text-xl font-bold text-zinc-900">
                              {desktopSelectedTier.price === 0 ? 'Free' : formatNaira(desktopSelectedTier.price)}
                            </p>
                            {desktopSelectedTier.price > 0 && (
                              <p className="text-[10px] text-zinc-400 mt-0.5">per ticket</p>
                            )}
                          </div>
                          {!isSoldOut(desktopSelectedTier) && (
                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                type="button"
                                onClick={() => setDesktopQty((prev) => Math.max(1, prev - 1))}
                                disabled={desktopQty <= 1}
                                aria-label="Decrease quantity"
                                className="w-8 h-8 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              </button>
                              <span className="text-base font-bold text-zinc-900 min-w-5 text-center tabular-nums">
                                {desktopQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDesktopQty((prev) => Math.min(desktopMaxQty, prev + 1))}
                                disabled={desktopQty >= desktopMaxQty}
                                aria-label="Increase quantity"
                                className="w-8 h-8 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Total price (multi-qty) */}
                      {desktopSelectedTier && desktopSelectedTier.price > 0 && desktopQty > 1 && (
                        <div className="flex justify-between items-center mb-4 py-3 border-t border-zinc-100">
                          <span className="text-sm text-zinc-500">{desktopQty} tickets total</span>
                          <span className="text-base font-bold text-zinc-900">{formatNaira(desktopTotal)}</span>
                        </div>
                      )}

                      {/* Desktop checkout button */}
                      <button
                        type="button"
                        disabled={allSoldOut || isPast}
                        onClick={() => setTicketSheetOpen(true)}
                        className="w-full bg-zinc-900 text-white font-bold py-4 rounded-full shadow-md active:scale-95 transition-all disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
                      >
                        {isPast ? 'Ended' : allSoldOut ? 'Sold Out' : 'Get Tickets'}
                      </button>

                      {/* Security badge */}
                      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-zinc-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 12 15 15 9" />
                        </svg>
                        <span>Secured by Paystack</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Organizer mini-card */}
                {organizer && (
                  <a
                    href={organizerHref}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-4 flex items-center gap-3 hover:bg-zinc-50 transition-colors no-underline"
                  >
                    <div className="w-10 h-10 rounded-full bg-violet-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {organizer.image ? (
                        <Image
                          src={organizer.image}
                          alt={organizer.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-violet-600 font-bold text-sm">
                          {organizer.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{organizer.name}</p>
                      <p className="text-[11px] text-zinc-400">Organizer · View profile</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 shrink-0 ml-auto" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </a>
                )}

              </div>
            </div>
            {/* ── END RIGHT COLUMN ─────────────────────────────── */}

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
