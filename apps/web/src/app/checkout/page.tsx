'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button, Input, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { BackLink } from '@/components/ui/BackLink'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { useAuthGate } from '@/hooks/useAuthGate'
import {
  authHeader,
  formatNaira,
  formatDate,
  isValidEmail,
  isValidNigerianPhone,
  calculatePlatformFee,
  calculatePaystackFee,
} from '@comfytag/utils'
import type { Event, TicketTier } from '@comfytag/types'
import api from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

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

type CheckoutState = 'loading' | 'ready' | 'processing' | 'success' | 'failed'
type FailureReason = 'verification_failed' | 'payment_declined' | 'timeout'

interface PromoResult {
  discountType: 'percentage' | 'fixed'
  discountValue: number
}

function CheckoutInner() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { gateOpen, openGate, closeGate } = useAuthGate()

  const eventId = searchParams.get('eventId') ?? ''
  const tierId = searchParams.get('tierId') ?? ''
  const qty = parseInt(searchParams.get('qty') ?? '1', 10)

  const [checkoutState, setCheckoutState] = useState<CheckoutState>('loading')
  const [event, setEvent] = useState<Event | null>(null)
  const [tier, setTier] = useState<TicketTier | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Guest form
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Promo
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState<PromoResult | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)

  // Success / failure
  const [successRef, setSuccessRef] = useState('')
  const [failureReason, setFailureReason] = useState<FailureReason>('verification_failed')
  const [lastReference, setLastReference] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Load Paystack script
  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    document.head.appendChild(s)
    return () => {
      document.head.removeChild(s)
    }
  }, [])

  // Fetch event on mount
  useEffect(() => {
    if (!eventId || !tierId) {
      setFetchError('Missing event or tier information.')
      setCheckoutState('ready')
      return
    }

    async function loadEvent() {
      try {
        const res = await fetch(`${API}/events/${eventId}`)
        if (!res.ok) throw new Error('Event not found')
        const data = (await res.json()) as Event
        const foundTier = data.ticketType.find((t) => t._id === tierId)
        if (!foundTier) throw new Error('Ticket tier not found')
        setEvent(data)
        setTier(foundTier)
        setCheckoutState('ready')
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load event')
        setCheckoutState('ready')
      }
    }

    loadEvent()
  }, [eventId, tierId])

  const isFree = tier ? tier.price === 0 : false

  // Fee calculations
  const subtotal = tier ? tier.price * qty : 0
  const platformFee = calculatePlatformFee(subtotal, 4)
  const paystackFee = calculatePaystackFee(subtotal)

  function applyPromoDiscount(base: number): number {
    if (!promoApplied) return base
    if (promoApplied.discountType === 'percentage') {
      return Math.round(base * (1 - promoApplied.discountValue / 100))
    }
    return Math.max(0, base - promoApplied.discountValue)
  }

  const discountedSubtotal = applyPromoDiscount(subtotal)
  const totalWithFees = discountedSubtotal + platformFee + paystackFee

  function validateGuestForm(): boolean {
    const errors: Record<string, string> = {}
    if (!guestName.trim()) errors.name = 'Full name is required'
    if (!isValidEmail(guestEmail)) errors.email = 'Enter a valid email address'
    if (!isValidNigerianPhone(guestPhone)) errors.phone = 'Enter a valid Nigerian phone number'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleApplyPromo() {
    if (!promoCode.trim()) return
    setPromoError(null)
    setPromoLoading(true)
    try {
      // TODO: wire promo endpoint
      const res = await fetch(`${API}/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, eventId }),
      })
      if (!res.ok) throw new Error('Invalid or expired code')
      const data = (await res.json()) as PromoResult
      setPromoApplied(data)
      setPromoError(null)
    } catch {
      setPromoError('Invalid or expired code')
      setPromoApplied(null)
    } finally {
      setPromoLoading(false)
    }
  }

  async function handleFreeTicket() {
    if (!session && !validateGuestForm()) return
    if (!event || !tier) return

    const ref = `FREE_${Date.now()}`
    setLastReference(ref)
    setCheckoutState('processing')

    try {
      await api.post(`/audience/free/${eventId}`, {
        name: session?.user.name ?? guestName,
        email: session?.user.email ?? guestEmail,
        phone: guestPhone || undefined,
        eventname: event.name,
        numOfTicket: qty,
        type: tier.name,
        userId: session?.user.id ?? undefined,
      })
      setSuccessRef(ref)
      setCheckoutState('success')
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
      if (!session && guestEmail) {
        api.post('/auth/magic-link', { email: guestEmail }).catch(() => {})
        setMagicLinkSent(true)
      }
    } catch {
      setFailureReason('verification_failed')
      setCheckoutState('failed')
    }
  }

  async function handlePaymentSuccess(reference: string) {
    if (!event || !tier || !session) {
      setFailureReason('verification_failed')
      setCheckoutState('failed')
      return
    }
    try {
      await api.post(`/paystack/verify/${reference}`, null, authHeader(session.user.token))

      await api.post(
        `/audience/${session.user.id}/${eventId}`,
        {
          name: session.user.name,
          email: session.user.email,
          phone: guestPhone || '',
          eventname: event.name,
          numOfTicket: qty,
          type: tier.name,
          amount: totalWithFees,
          reference,
          status: 'active',
        },
        authHeader(session.user.token),
      )

      setSuccessRef(reference)
      setCheckoutState('success')
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
    } catch {
      setFailureReason('verification_failed')
      setCheckoutState('failed')
    }
  }

  function initPaystack() {
    if (!session) {
      openGate('checkout')
      return
    }

    const ref = `CT_${Date.now()}`
    setLastReference(ref)

    setCheckoutState('processing')

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? '',
      email: session.user.email,
      amount: totalWithFees * 100,
      ref,
      currency: 'NGN',
      firstname: session.user.name.split(' ')[0],
      onClose() {
        setCheckoutState('ready')
      },
      callback(res: { reference: string }) {
        handlePaymentSuccess(res.reference)
      },
    })

    handler.openIframe()
  }

  async function retryVerification(ref: string) {
    setCheckoutState('processing')
    await handlePaymentSuccess(ref)
  }

  // ── Loading state ───────────────────────────────────────
  if (checkoutState === 'loading') {
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

  // ── Fetch error ─────────────────────────────────────────
  if (fetchError || !event || !tier) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          padding: '24px',
          gap: '16px',
        }}
      >
        <ErrorMessage message={fetchError ?? 'Event not found'} />
        <BackLink href={`/events/${eventId}`}>Back to event</BackLink>
      </div>
    )
  }

  // ── Processing overlay ──────────────────────────────────
  if (checkoutState === 'processing') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          gap: '16px',
        }}
      >
        <LoadingSpinner size="lg" centered />
        <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', margin: 0 }}>
          {isFree ? 'Securing your free ticket…' : 'Processing your payment…'}
        </p>
      </div>
    )
  }

  const eventName = event.name
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/events/${event.slug ?? event._id}`
      : `https://comfytag.com/events/${event.slug ?? event._id}`
  const contactInfo = session?.user.email ?? guestEmail

  // ── Success state ───────────────────────────────────────
  if (checkoutState === 'success') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes __ct_confetti {
            0%   { transform: translateY(0)   rotate(0deg);   opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
        `}</style>

        {/* Confetti pieces */}
        {Array.from({ length: 20 }).map((_, i) => {
          const colors = [
            '#7C3AED', '#F59E0B', '#10B981', '#EF4444',
            '#3B82F6', '#EC4899', '#F97316', '#06B6D4',
          ]
          const size = 8 + (i % 5) * 4
          return (
            <div
              key={i}
              aria-hidden="true"
              style={{
                position: 'fixed',
                top: `-${size}px`,
                left: `${(i * 5 + 3) % 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: i % 3 === 0 ? '50%' : '2px',
                background: colors[i % colors.length],
                animation: `__ct_confetti ${2 + (i % 4) * 0.5}s ease-in ${(i * 0.15) % 2}s both`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          )
        })}

        {/* Success card */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '400px',
            width: '100%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Checkmark SVG */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="12" fill="#10B981" />
            <path
              d="M7 12.5l3.5 3.5 6.5-7"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            Ticket Secured!
          </h1>

          <p
            style={{
              fontSize: '16px',
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            {eventName}
          </p>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-muted)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Your ticket has been sent to{' '}
            <strong style={{ color: 'var(--color-text)' }}>{contactInfo || guestPhone}</strong>{' '}
            via WhatsApp and email.
          </p>

          {magicLinkSent && (
            <div style={{ width: '100%', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5, textAlign: 'left' }}>
              📧 We sent a login link to <strong>{guestEmail}</strong> — tap it to access your tickets anytime.
            </div>
          )}

          {/* Shareable OG card */}
          <div style={{ width: '100%' }}>
            <img
              src={`/api/og?eventId=${eventId}&ref=${successRef}`}
              width={400}
              height={209}
              alt="Share card"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                display: 'block',
              }}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: eventName, url: shareUrl })
                } else {
                  navigator.clipboard.writeText(shareUrl)
                }
              }}
            />
            <p
              style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                margin: '6px 0 0',
                textAlign: 'center',
              }}
            >
              Tap to share
            </p>
          </div>

          {/* WhatsApp share button */}
          <WhatsAppButton
            href={`https://wa.me/?text=${encodeURIComponent(
              `Omo, e be like I just got my ticket for ${eventName} 🎟️ This thing go mad! Get yours: ${shareUrl}`,
            )}`}
            label="Share on WhatsApp"
            fullWidth
          />

          {/* View tickets */}
          <div style={{ width: '100%' }}>
            <Button variant="ghost" fullWidth onClick={() => { window.location.href = '/tickets' }}>
              View My Tickets
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Failed state ────────────────────────────────────────
  if (checkoutState === 'failed') {
    const failureConfig = {
      verification_failed: {
        message:
          'Payment received but ticket not issued. Tap below to retry verification.',
        buttonLabel: 'Retry Verification',
        onAction: () => retryVerification(lastReference),
      },
      payment_declined: {
        message:
          'Payment was declined. Check your card details and try again.',
        buttonLabel: 'Try Again',
        onAction: () => setCheckoutState('ready'),
      },
      timeout: {
        message:
          'The payment timed out. If you were charged, tap below.',
        buttonLabel: 'Check my payment status',
        onAction: () => retryVerification(lastReference),
      },
    }

    const cfg = failureConfig[failureReason]

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
        <div
          style={{
            maxWidth: '400px',
            width: '100%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Error icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="12" fill="var(--color-error)" />
            <path
              d="M8 8l8 8M16 8l-8 8"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>

          <h2
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            Payment Issue
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {cfg.message}
          </p>

          <div style={{ width: '100%' }}>
            <Button variant="primary" fullWidth onClick={cfg.onAction}>
              {cfg.buttonLabel}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => retryVerification(lastReference)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              textDecoration: 'underline',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            Debited but no ticket?
          </button>
        </div>
      </div>
    )
  }

  // ── Ready state ─────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        justifyContent: 'center',
        padding: '32px 16px 64px',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%' }}>
        {/* Back link */}
        <Link
          href={`/events/${event.slug ?? event._id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            marginBottom: '20px',
          }}
        >
          ← Back to event
        </Link>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--color-text)',
            marginBottom: '20px',
          }}
        >
          Complete your order
        </h1>

        {/* Event summary card */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            {(() => {
              const coverSrc = event.coverImage ?? event.images[0]
              return coverSrc ? (
                <Image
                  src={coverSrc}
                  alt={event.name}
                  width={60}
                  height={60}
                  style={{ borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : null
            })()}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  margin: '0 0 4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.name}
              </p>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                  margin: '0 0 2px',
                }}
              >
                {formatDate(event.date)}
              </p>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.venue}
              </p>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              {tier.name} × {qty}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: isFree ? 'var(--color-success)' : 'var(--color-text)' }}>
              {isFree ? 'Free' : formatNaira(totalWithFees)}
            </span>
          </div>
        </div>

        {/* Guest form or logged-in user info */}
        {session ? (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                margin: '0 0 4px',
                fontWeight: 500,
              }}
            >
              Booking as
            </p>
            <p
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-text)',
                margin: '0 0 2px',
              }}
            >
              {session.user.name}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              {session.user.email}
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <p
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text)',
                margin: 0,
              }}
            >
              Your details
            </p>

            <Input
              label="Full Name"
              id="guest-name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Tolu Adeyemi"
              error={formErrors.name}
              required
            />

            <Input
              label="Email Address"
              id="guest-email"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="e.g. tolu@email.com"
              error={formErrors.email}
              required
            />

            <div>
              <Input
                label="Phone Number"
                id="guest-phone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                error={formErrors.phone}
                required
              />
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  margin: '6px 0 0',
                }}
              >
                We'll send your ticket to this number via WhatsApp
              </p>
            </div>
          </div>
        )}

        {/* Promo code row — hidden for free tickets */}
        {!isFree && <div style={{ marginBottom: '20px' }}>
          {!promoOpen ? (
            <button
              type="button"
              onClick={() => setPromoOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--color-brand)',
                padding: 0,
                fontFamily: 'inherit',
                textDecoration: 'underline',
              }}
            >
              Have a promo code?
            </button>
          ) : (
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  margin: '0 0 10px',
                }}
              >
                Promo code
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    id="promo-code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleApplyPromo}
                  loading={promoLoading}
                  disabled={promoApplied !== null}
                >
                  {promoApplied ? 'Applied ✓' : 'Apply'}
                </Button>
              </div>
              {promoError && (
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-error)',
                    margin: '6px 0 0',
                  }}
                >
                  {promoError}
                </p>
              )}
              {promoApplied && (
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-success)',
                    margin: '6px 0 0',
                    fontWeight: 600,
                  }}
                >
                  Discount applied!
                </p>
              )}
            </div>
          )}
        </div>}

        {/* Fee breakdown — hidden for free tickets */}
        {!isFree && (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Subtotal
              </span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {formatNaira(discountedSubtotal)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Platform fee (4%)
              </span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {formatNaira(platformFee)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Processing fee (1.5% + ₦100)
              </span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {formatNaira(paystackFee)}
              </span>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                Total
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                {formatNaira(totalWithFees)}
              </span>
            </div>
          </div>
        )}

        {/* CTA button */}
        {isFree ? (
          <Button variant="primary" size="lg" fullWidth onClick={handleFreeTicket}>
            Get Free Ticket
          </Button>
        ) : (
          <Button variant="primary" size="lg" fullWidth onClick={initPaystack}>
            Pay {formatNaira(totalWithFees)} Now
          </Button>
        )}
      </div>

      <AuthGateSheet
        isOpen={gateOpen}
        onClose={closeGate}
        trigger="checkout"
        redirectTo={typeof window !== 'undefined' ? window.location.href : '/checkout'}
      />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <CheckoutInner />
    </Suspense>
  )
}
