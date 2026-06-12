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

  // Load Paystack script
  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    document.head.appendChild(s)
    return () => {
      document.head.removeChild(s)
    }
  }, [])

  // Handle free ticket purchase
  const handleFreeTicket = async (details: typeof guestDetails) => {
    if (!checkout.event || !checkout.tier) return

    const ref = `FREE_${Date.now()}`
    setLastReference(ref)

    try {
      await api.post(`/audience/free/${eventId}`, {
        name: session?.user.name ?? details.name,
        email: session?.user.email ?? details.email,
        phone: details.phone || undefined,
        eventname: checkout.event.name,
        numOfTicket: qty,
        type: checkout.tier.name,
        userId: session?.user.id ?? undefined,
      })
      setSuccessRef(ref)
      // Bust cached event inventory and user ticket list so both UIs
      // reflect the new purchase without requiring a hard reload.
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(checkout.event.slug ?? eventId) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.list() })
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
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
      await api.post(`/paystack/verify/${reference}`)

      await api.post(
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

      setSuccessRef(reference)
      // Bust cached event inventory and user ticket list so both UIs
      // reflect the new purchase without requiring a hard reload.
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(checkout.event.slug ?? eventId) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.list() })
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
    } catch {
      setFailureReason('verification_failed')
    }
  }

  // Initiate Paystack payment
  const initPaystack = () => {
    if (!session) {
      openGate('checkout')
      return
    }

    const ref = `CT_${Date.now()}`
    setLastReference(ref)

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? '',
      email: session.user.email,
      amount: checkout.fees.total * 100,
      ref,
      currency: 'NGN',
      firstname: (session.user.name ?? '').split(' ')[0],
      onClose() {
        // Return to ready state when modal closes
      },
      callback(res: { reference: string }) {
        handlePaymentSuccess(res.reference)
      },
    })

    handler.openIframe()
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
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        justifyContent: 'center',
        padding: '32px 16px 64px',
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%' }}>
        {/* Back link */}
        <Link
          href={`/events/${checkout.event.slug ?? checkout.event._id}`}
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
            subtotal={checkout.fees.discountedSubtotal}
            platformFee={checkout.fees.platformFee}
            paystackFee={checkout.fees.paystackFee}
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
          <Button variant="primary" size="lg" fullWidth onClick={initPaystack}>
            Pay {formatNaira(checkout.fees.total)} Now
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
