'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useBecomePartner } from '@/hooks/useProfile'

interface PaymentSuccessViewProps {
  eventId: string
  eventName: string
  successRef: string
  contactInfo: string
  magicLinkSent: boolean
  guestEmail?: string
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function PaymentSuccessView({
  eventId,
  eventName,
  contactInfo,
  magicLinkSent,
  guestEmail,
}: PaymentSuccessViewProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isPartner = session?.user?.isPartner ?? true
  const { mutate: becomePartner, isPending: isBecomingPartner } = useBecomePartner()

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/events/${eventId}`
      : `https://comfytag.com/events/${eventId}`

  const displayName = toTitleCase(eventName)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: eventName, url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl).catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md flex flex-col items-center">

        {/* Apple-style animated success header */}
        <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
          {/* Emerald checkmark badge */}
          <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center ring-8 ring-emerald-100">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="12" fill="#10B981" />
              <path
                d="M7 12.5l3.5 3.5 6.5-7"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-black mt-6 text-foreground text-center leading-tight">
            {displayName}
          </h1>
          <p className="text-muted-foreground mt-2 text-base text-center">
            Your ticket is confirmed! 🎟️
          </p>
        </div>

        {/* Confirmation info */}
        {contactInfo && (
          <p className="mt-4 text-sm text-muted-foreground text-center leading-relaxed">
            Your ticket has been sent to{' '}
            <strong className="text-foreground">{contactInfo}</strong> via email.
          </p>
        )}

        {/* Magic link notification */}
        {magicLinkSent && (
          <div className="mt-4 w-full bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 text-sm text-zinc-700 leading-relaxed">
            📧 We sent a login link to <strong>{guestEmail}</strong> — tap it to access your
            tickets anytime.
          </div>
        )}

        {/* Instagram-ready share card */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Share ${eventName}`}
          onClick={handleShare}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleShare() }}
          className="mt-8 w-full max-w-sm bg-linear-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden border border-transparent hover:border-white/30 transition-colors duration-(--duration-micro) ease-(--ease-standard) cursor-pointer"
        >
          {/* Decorative ticket-texture circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" aria-hidden="true" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-white/5 rounded-full" aria-hidden="true" />
          <div className="absolute top-1/2 right-3 -translate-y-1/2 w-20 h-20 bg-white/5 rounded-full" aria-hidden="true" />

          <div className="relative z-10 flex flex-col items-center text-center gap-3">
            <div className="text-4xl" aria-hidden="true">🎟️</div>
            <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
              Just Got My Ticket! ✨
            </p>
            <p className="text-xl font-black leading-tight">
              {displayName}
            </p>
            <p className="text-xs text-white/50 font-medium mt-1">
              comfytag.com
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Tap card to share</p>

        {/* WhatsApp share button */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `Omo, e be like I just got my ticket for ${eventName} 🎟️ This thing go mad! Get yours: ${shareUrl}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl py-4 font-bold transition-colors no-underline"
          style={{ textDecoration: 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378L.057 24l1.687-6.163a9.855 9.855 0 01-1.587-5.946c.003-5.45 4.436-9.884 9.888-9.884 2.64.001 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .06 5.435.058 12.001a11.95 11.95 0 001.6 6l-1.7 6.196 6.354-1.664a11.967 11.967 0 005.74 1.463h.005c6.554 0 11.89-5.435 11.893-12.001a11.84 11.84 0 00-3.48-8.412" />
          </svg>
          Share on WhatsApp
        </a>

        {/* View My Tickets */}
        <button
          type="button"
          onClick={() => router.push('/tickets')}
          className="mt-3 w-full border-2 border-border hover:border-violet-600 hover:text-violet-700 text-foreground rounded-xl py-4 font-bold transition-all bg-transparent cursor-pointer"
        >
          View My Tickets
        </button>

        {!isPartner && (
          <p className="mt-8 text-xs text-muted-foreground text-center">
            Thinking about hosting your own event?{' '}
            <button
              type="button"
              onClick={() => becomePartner()}
              disabled={isBecomingPartner}
              className="font-bold text-violet-600 hover:text-violet-700 underline bg-transparent border-none p-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBecomingPartner ? 'Setting up your dashboard…' : 'Become a Partner'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
