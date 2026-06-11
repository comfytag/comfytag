'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@comfytag/ui'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'

interface PaymentSuccessViewProps {
  eventId: string
  eventName: string
  successRef: string
  contactInfo: string
  magicLinkSent: boolean
  guestEmail?: string
}

const CONFETTI_COLORS = ['#7C3AED', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899']

export function PaymentSuccessView({
  eventId,
  eventName,
  successRef,
  contactInfo,
  magicLinkSent,
  guestEmail,
}: PaymentSuccessViewProps) {
  const router = useRouter()
  const [shareImgBroken, setShareImgBroken] = useState(false)

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/events/${eventId}`
      : `https://comfytag.com/events/${eventId}`

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: eventName, url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl).catch(() => {})
    }
  }

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
        const colors = CONFETTI_COLORS
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
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="12" style={{ fill: 'var(--color-success)' }} />
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
          <strong style={{ color: 'var(--color-text)' }}>{contactInfo}</strong> via email.
        </p>

        {magicLinkSent && (
          <div
            style={{
              width: '100%',
              background: 'color-mix(in srgb, var(--color-brand) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-brand) 20%, transparent)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '13px',
              color: 'var(--color-text)',
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            📧 We sent a login link to <strong>{guestEmail}</strong> — tap it to access your
            tickets anytime.
          </div>
        )}

        {/* Shareable OG card */}
        <div style={{ width: '100%' }}>
          {shareImgBroken ? (
            <div
              role="button"
              tabIndex={0}
              aria-label={`Share ${eventName}`}
              onClick={handleShare}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleShare() }}
              style={{
                width: '100%',
                aspectRatio: '400 / 209',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark, #5B21B6) 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '24px 28px',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '28px', lineHeight: 1 }} aria-hidden="true">🎟️</div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.3,
                }}
              >
                {eventName}
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: '8px',
                  padding: '5px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '0.02em',
                }}
              >
                Just Got My Ticket! ✨
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
                comfytag.com
              </div>
            </div>
          ) : (
            <img
              src={`/api/og?eventId=${eventId}&ref=${successRef}`}
              width={400}
              height={209}
              alt={`Share card for ${eventName}`}
              onError={() => setShareImgBroken(true)}
              onClick={handleShare}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                cursor: 'pointer',
                display: 'block',
              }}
            />
          )}
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
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              router.push('/tickets')
            }}
          >
            View My Tickets
          </Button>
        </div>
      </div>
    </div>
  )
}
