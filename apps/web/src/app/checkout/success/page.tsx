'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@comfytag/ui'
import { PaymentSuccessView } from '@/components/checkout/PaymentSuccessView'

function SuccessInner() {
  const params = useSearchParams()
  const ref = params.get('ref') ?? ''
  const eventId = params.get('eventId') ?? ''
  const eventName = params.get('eventName') ?? 'Your Event'
  const contactInfo = params.get('contactInfo') ?? ''
  const guestEmail = params.get('guestEmail') ?? undefined

  return (
    <PaymentSuccessView
      eventId={eventId}
      eventName={eventName}
      successRef={ref}
      contactInfo={contactInfo}
      magicLinkSent={false}
      guestEmail={guestEmail}
    />
  )
}

export default function CheckoutSuccessPage() {
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
      <SuccessInner />
    </Suspense>
  )
}
