'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { useAuthGate } from '@/hooks/useAuthGate'
import { useQueryClient } from '@tanstack/react-query'
import { useCheckout } from '@/hooks/useCheckout'
import { eventKeys, ticketKeys } from '@/hooks/queryKeys'
import { formatNaira } from '@comfytag/utils'
import {
  CheckoutSummary,
  GuestDetailsForm,
  PromoCodeInput,
  FeeBreakdown,
  PaymentSuccessView,
  PaymentFailedView,
  CheckoutAuthenticatedUser,
} from '@/components/checkout'
import { api } from '@/lib/api'

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
        metadata?: Record<string, unknown>
        onClose(): void
        callback(res: { reference: string }): void
      }): { openIframe(): void }
    }
  }
}

type FailureReason = 'verification_failed' | 'payment_declined' | 'timeout'

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { gateOpen, openGate, closeGate } = useAuthGate()

  const eventId = searchParams.get('eventId') ?? ''
  const tierId = searchParams.get('tierId') ?? ''
  const qty = parseInt(searchParams.get('qty') ?? '1', 10)

  const queryClient = useQueryClient()

  // Call the useCheckout hook for all data fetching and state management
  const checkout = useCheckout(eventId, tierId, qty)

  // Local state for guest details and payment flow
  const [guestDetails, setGuestDetails] = useState({ name: '', email: '', phone: '' })
  const [failureReason, setFailureReason] = useState<FailureReason>('verification_failed')
  const [successRef, setSuccessRef] = useState('')
  const [lastReference, setLastReference] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const isFree = checkout.tier ? checkout.tier.price === 0 : false

  // Load Paystack script. No cleanup/removal of the *tag* on unmount and a
  // dedup guard on add — without both, React 18 Strict Mode's dev-only
  // mount→cleanup→remount cycle tears the tag out and re-adds it, aborting
  // the in-flight fetch and restarting it, which is what makes the popup
  // feel like it takes forever to open on the first load in development.
  //
  // paystackReady tracks whether the script has actually finished loading —
  // on a slow connection to Paystack's CDN, clicking "Pay Now" before it has
  // loaded used to call window.PaystackPop.setup() while PaystackPop was
  // still undefined, throwing silently with no visible feedback: the popup
  // just never opened, and only a second click (after the script had since
  // finished loading in the background) would work.
  const [paystackReady, setPaystackReady] = useState(false)
  useEffect(() => {
    if (window.PaystackPop) {
      setPaystackReady(true)
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src*="paystack"]')
    const script = existing ?? document.createElement('script')
    const onLoad = () => setPaystackReady(true)
    script.addEventListener('load', onLoad)
    if (!existing) {
      script.src = 'https://js.paystack.co/v1/inline.js'
      document.head.appendChild(script)
    }
    return () => script.removeEventListener('load', onLoad)
  }, [])

  // True while waiting for a not-yet-loaded Paystack script after a click —
  // the popup opens automatically the moment paystackReady flips true.
  const [preparingPayment, setPreparingPayment] = useState(false)
  const [paystackLoadError, setPaystackLoadError] = useState(false)

  useEffect(() => {
    if (!preparingPayment) return
    if (paystackReady) {
      setPreparingPayment(false)
      openPaystackPopup()
      return
    }
    const timeoutId = setTimeout(() => {
      setPreparingPayment(false)
      setPaystackLoadError(true)
    }, 15000)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preparingPayment, paystackReady])

  // Handle free ticket purchase
  const handleFreeTicket = async (details: typeof guestDetails) => {
    if (!checkout.event || !checkout.tier) return

    const ref = `FREE_${Date.now()}`
    setLastReference(ref)

    try {
      const res = await api.post(`/audience/free/${eventId}`, {
        name: session?.user.name ?? details.name,
        email: session?.user.email ?? details.email,
        phone: details.phone || undefined,
        eventname: checkout.event.name,
        numOfTicket: qty,
        type: checkout.tier.name,
        userId: session?.user.id ?? undefined,
      })
      // Bust cached event inventory and user ticket list so both UIs
      // reflect the new purchase without requiring a hard reload.
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(checkout.event.slug ?? eventId) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.list() })
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
      const ticketId = res.data?.data?._id ?? res.data?._id
      if (session && ticketId) {
        // Signed-in buyer — skip the share screen and go straight to the ticket.
        router.push(`/tickets/${ticketId}`)
        return
      }
      // Guest purchase — there's no session to view /tickets with, so keep
      // showing the inline success screen with the magic-link messaging.
      setSuccessRef(ref)
      if (!session && details.email) {
        api.post('/auth/magic-link', { email: details.email }).catch(() => {})
        setMagicLinkSent(true)
      }
      // Manually update checkout status
      checkout.reset()
    } catch {
      setFailureReason('verification_failed')
    }
  }

  // Handle payment success
  const handlePaymentSuccess = async (reference: string) => {
    if (!checkout.event || !checkout.tier || !session) {
      setFailureReason('verification_failed')
      return
    }
    try {
      // No separate pre-verify call here — /audience/:userId/:eventId already
      // re-verifies this reference against Paystack server-side before it will
      // create a ticket (see apps/api/controllers/audience.js), so a first round
      // trip to /paystack/verify would only add latency without adding safety.
      const res = await api.post(
        `/audience/${session.user.id}/${eventId}`,
        {
          name: session.user.name,
          email: session.user.email,
          phone: guestDetails.phone || '',
          eventname: checkout.event.name,
          numOfTicket: qty,
          type: checkout.tier.name,
          amount: checkout.fees.total,
          reference,
          status: 'active',
        },
      )

      // Bust cached event inventory and user ticket list so both UIs
      // reflect the new purchase without requiring a hard reload.
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(checkout.event.slug ?? eventId) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.list() })
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }

      const ticketId = res.data?.data?._id ?? res.data?._id
      if (ticketId) {
        // Skip the share screen — go straight to the ticket that was just bought.
        router.push(`/tickets/${ticketId}`)
        return
      }
      setSuccessRef(reference)
    } catch {
      setFailureReason('verification_failed')
    }
  }

  // Actually opens the Paystack popup — assumes window.PaystackPop is loaded.
  // Called either immediately (script was already ready) or automatically by
  // the preparingPayment effect above once the script finishes loading.
  const openPaystackPopup = () => {
    if (!session || !window.PaystackPop) return

    const ref = `CT_${Date.now()}`
    setLastReference(ref)

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '',
      email: session.user.email,
      amount: checkout.fees.total * 100,
      ref,
      currency: 'NGN',
      firstname: (session.user.name ?? '').split(' ')[0],
      // Lets the webhook rebuild this exact ticket if the client never
      // completes the create-ticket call after a successful charge.
      metadata: {
        userId: session.user.id,
        eventId,
        tierName: checkout.tier?.name,
        numOfTicket: qty,
        name: session.user.name,
        email: session.user.email,
        phone: guestDetails.phone || '',
      },
      onClose() {
        // Return to ready state when modal closes
      },
      callback(res: { reference: string }) {
        handlePaymentSuccess(res.reference)
      },
    })

    handler.openIframe()
  }

  // Initiate Paystack payment
  const initPaystack = () => {
    if (!session) {
      openGate('checkout')
      return
    }

    setPaystackLoadError(false)

    if (paystackReady && window.PaystackPop) {
      openPaystackPopup()
      return
    }

    // Script hasn't finished loading yet (slow connection to Paystack's CDN) —
    // wait for it instead of calling window.PaystackPop.setup() on undefined,
    // which used to fail silently and made the popup seem to never open.
    setPreparingPayment(true)
  }

  // Retry verification
  const retryVerification = async (ref: string) => {
    await handlePaymentSuccess(ref)
  }

  // ── Loading state ───────────────────────────────────────
  if (checkout.status === 'loading') {
    return (
      <div
        suppressHydrationWarning
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
  if (checkout.error || !checkout.event || !checkout.tier) {
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
        <ErrorMessage message={checkout.error ?? 'Event not found'} />
        <Link
          href={`/events/${eventId}`}
          style={{
            fontSize: '14px',
            color: 'var(--color-brand)',
            textDecoration: 'none',
          }}
        >
          ← Back to event
        </Link>
      </div>
    )
  }

  // ── Processing overlay ──────────────────────────────────
  if (checkout.status === 'processing') {
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

  const contactInfo = session?.user.email ?? guestDetails.email

  // ── Success state ───────────────────────────────────────
  if (checkout.status === 'success' || successRef) {
    return (
      <PaymentSuccessView
        eventId={checkout.event._id}
        eventName={checkout.event.name}
        successRef={successRef || lastReference}
        contactInfo={contactInfo || guestDetails.phone}
        magicLinkSent={magicLinkSent}
        guestEmail={guestDetails.email}
      />
    )
  }

  // ── Failed state ────────────────────────────────────────
  if (checkout.status === 'failed') {
    return (
      <PaymentFailedView
        reason={failureReason}
        onRetry={() => retryVerification(lastReference)}
        onRetryDebited={() => retryVerification(lastReference)}
      />
    )
  }

  // ── Ready state ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50/50 flex justify-center py-20 px-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl border border-(--color-border)">
        {/* Back link */}
        <Link
          href={`/events/${checkout.event.slug ?? checkout.event._id}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 mb-6 transition-colors no-underline"
          style={{ textDecoration: 'none' }}
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
        <CheckoutSummary
          event={checkout.event}
          tier={checkout.tier}
          quantity={qty}
          isFree={isFree}
          total={checkout.fees.total}
        />

        {/* Guest form or logged-in user info */}
        {session ? (
          <CheckoutAuthenticatedUser session={session} />
        ) : (
          <GuestDetailsForm
            onSubmit={(details) => {
              setGuestDetails(details)
              if (isFree) {
                handleFreeTicket(details)
              }
            }}
          />
        )}

        {/* Promo code input — hidden for free tickets */}
        {!isFree && (
          <PromoCodeInput
            onApply={checkout.applyPromo}
            applied={checkout.promoApplied}
          />
        )}

        {/* Fee breakdown — hidden for free tickets */}
        {!isFree && (
          <FeeBreakdown
            subtotal={checkout.fees.subtotal}
            processingFee={checkout.fees.processingFee}
            total={checkout.fees.total}
          />
        )}

        {/* CTA button */}
        {isFree ? (
          session ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => handleFreeTicket(guestDetails)}
            >
              Get Free Ticket
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              form="guest-checkout-form"
            >
              Get Free Ticket
            </Button>
          )
        ) : (
          <>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={preparingPayment}
              onClick={initPaystack}
            >
              {preparingPayment
                ? 'Preparing secure payment…'
                : `Pay ${formatNaira(checkout.fees.total)} Now`}
            </Button>
            {paystackLoadError && (
              <p
                style={{
                  marginTop: '10px',
                  fontSize: '13px',
                  color: 'var(--color-error)',
                  textAlign: 'center',
                }}
              >
                Payment is taking longer than expected to load. Check your connection and try again.
              </p>
            )}
          </>
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
