'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Event, Ticket } from '@comfytag/types'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import { Navbar } from '@/components/layout/Navbar'
import { api } from '@/lib/api'
import { useTicketById } from '@/hooks/useTickets'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

type ScanState = 'idle' | 'scanned' | 'used' | 'error'

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function TicketDetailPage() {
  const { data: session, status } = useSession()
  const { id } = useParams<{ id: string }>()

  const { data: ticket, isLoading } = useTicketById(id)
  const [event, setEvent] = useState<Event | null>(null)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // ─── Fetch event details once ticket is known ────────────────────────────────
  useEffect(() => {
    if (!ticket || !session) return
    api
      .get(`/events/${ticket.event_id}`)
      .then((r) => {
        const data = r.data?.data ?? r.data
        if (data && typeof data === 'object' && '_id' in data) {
          setEvent(data as Event)
        }
      })
      .catch(() => {})
  }, [ticket, session])

  // ─── SSE scan state ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ticket || !session) return
    const url = `${API}/tickets/${ticket._id}/status`
    const es = new EventSource(url, { withCredentials: true })
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data) as { checkedIn?: boolean }
        setScanState(payload.checkedIn ? 'used' : 'idle')
      } catch {
        // silent
      }
    }
    es.onerror = () => setScanState('error')
    return () => es.close()
  }, [ticket, session])

  // ─── Wake Lock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ticket || ticket.status === 'used') return
    if ('wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((lock) => {
          wakeLockRef.current = lock
        })
        .catch(() => {})
    }
    return () => {
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [ticket])

  // ─── QR source ───────────────────────────────────────────────────────────────
  const qrSrc = ticket?.qrCode ?? null

  // ─── Auth guard ───────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return <LoadingSpinner size="lg" centered />
  }

  if (!session) {
    return (
      <EmptyState
        title="Sign in to view your tickets"
        action={{ label: 'Log In', href: '/login' }}
      />
    )
  }

  const isUsed = ticket?.status === 'used'
  const isActive = ticket?.status === 'active'
  // coverImage is optional in the schema — fall through to images[0]
  const coverImg = event?.coverImage ?? event?.images?.[0] ?? null

  return (
    <>
      <Navbar />
      <main className="w-full min-h-screen bg-zinc-50 pt-8 pb-16 px-4 flex flex-col items-center">
        {/* Back link */}
        <Link
          href="/tickets"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-6 w-full max-w-md"
        >
          ← Back to Wallet
        </Link>

        {isLoading ? (
          <div className="w-full max-w-md flex justify-center py-20">
            <LoadingSpinner centered size="lg" />
          </div>
        ) : !ticket ? (
          <div className="w-full max-w-md">
            <EmptyState
              title="Ticket not found"
              action={{ label: 'Back to tickets', href: '/tickets' }}
            />
          </div>
        ) : (
          <>
            {/* ── Ticket Card ─────────────────────────────────────── */}
            <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-100 overflow-hidden flex flex-col">

              {/* Violet gradient accent bar */}
              <div className="h-3 w-full bg-linear-to-r from-violet-600 to-indigo-600" />

              {/* Top half: event meta */}
              <div className="p-8">
                <div className="flex justify-between items-start gap-4">

                  {/* Left: status + title + location */}
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUsed ? (
                        <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-xs font-black uppercase tracking-wider rounded-full">
                          Used
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-emerald-600 font-bold text-xs tracking-widest uppercase">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      )}
                      <span className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-black uppercase tracking-wider rounded-full">
                        {toTitleCase(ticket.type)}
                      </span>
                    </div>

                    <h1 className="text-2xl font-black text-zinc-900 mt-3 truncate">
                      {toTitleCase(ticket.eventname)}
                    </h1>

                    {event && (
                      <>
                        <p className="text-sm font-medium text-zinc-500 mt-1 truncate">
                          {toTitleCase(event.venue)}{event.state ? `, ${toTitleCase(event.state)}` : ''}
                        </p>
                        <p className="text-sm text-zinc-400 mt-0.5">
                          {formatDate(event.date)}
                          {event.startTime ? ` · ${event.startTime}` : ''}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Right: event cover thumbnail */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-zinc-100 bg-violet-500">
                    {coverImg ? (
                      <Image
                        src={coverImg}
                        alt={event?.name ?? ticket.eventname}
                        fill
                        className="object-cover"
                        sizes="96px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-violet-500 to-indigo-600" />
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-zinc-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Name</p>
                    <p className="text-sm font-bold text-zinc-800">{toTitleCase(ticket.name)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Qty</p>
                    <p className="text-sm font-bold text-zinc-800">{ticket.numOfTicket}</p>
                  </div>
                </div>
              </div>

              {/* Ticket perforation divider */}
              <div className="relative w-full flex items-center">
                <div className="absolute -left-4 w-8 h-8 bg-zinc-50 rounded-full shadow-inner" />
                <div className="w-full border-t-2 border-dashed border-zinc-200" />
                <div className="absolute -right-4 w-8 h-8 bg-zinc-50 rounded-full shadow-inner" />
              </div>

              {/* Bottom half: QR code */}
              <div className="p-8 flex flex-col items-center bg-white">
                {qrSrc ? (
                  <div className="p-4 border-2 border-zinc-100 rounded-2xl bg-white mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrSrc}
                      alt="Ticket QR code — scan at venue entry"
                      width={180}
                      height={180}
                      className="block"
                    />
                  </div>
                ) : (
                  <div className="w-53 h-53 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
                    <p className="text-xs text-zinc-400">QR loading…</p>
                  </div>
                )}

                {isUsed ? (
                  <div className="flex flex-col items-center gap-1 mb-4">
                    <span className="text-2xl" aria-hidden="true">✅</span>
                    <p className="font-bold text-sm text-zinc-900">Entry Granted</p>
                    <p className="text-xs text-zinc-400">You attended this event</p>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm tracking-widest mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}

                {event && (
                  <Link
                    href={`/events/${event.slug ?? event._id}`}
                    className="text-xs text-violet-600 font-semibold hover:text-violet-800 transition-colors"
                  >
                    View Event Details →
                  </Link>
                )}
              </div>
            </div>

            {/* ── Actions Block ─────────────────────────────────────── */}
            <div className="w-full max-w-md mt-8 space-y-4">

              {event?.gateRules && event.gateRules.length > 0 && (
                <div className="bg-white border border-zinc-100 rounded-2xl p-5">
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
                    Gate Rules
                  </h2>
                  <ul className="space-y-2 pl-4 list-disc">
                    {event.gateRules.map((rule, i) => (
                      <li key={i} className="text-sm text-zinc-600 leading-relaxed">
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isActive && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/claim-ticket?ref=${ticket.reference}`
                      if (navigator.share) {
                        navigator.share({
                          title: `Ticket for ${ticket.eventname}`,
                          url,
                        })
                      } else {
                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(
                            `I'm sending you my ticket for ${ticket.eventname}! Claim it here: ${url}`,
                          )}`,
                          '_blank',
                        )
                      }
                    }}
                    className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all"
                  >
                    Send to Friend
                  </button>
                  <p className="text-xs text-zinc-400 text-center">
                    Recipient must sign up to claim. Ticket returns to you after 48h if unclaimed.
                  </p>
                </>
              )}

              <p className="text-center text-sm text-zinc-500 font-mono mt-4">
                Offline? Show this code at the gate:{' '}
                <strong className="text-zinc-800">{ticket.reference}</strong>
              </p>
            </div>
          </>
        )}
      </main>
    </>
  )
}
