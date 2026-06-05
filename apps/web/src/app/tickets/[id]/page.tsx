'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Event, Ticket } from '@comfytag/types'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { authHeader } from '@comfytag/utils'
import { Navbar } from '@/components/layout/Navbar'
import { DigitalStub } from '@/components/ui'
import { BackLink } from '@/components/ui/BackLink'
import { api } from '@/lib/api'
import { useTicketById } from '@/hooks/useTickets'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

type ScanState = 'idle' | 'scanned' | 'used' | 'error'

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
    const es = new EventSource(url)
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

  // ─── Promote SSE 'used' into ticket state ─────────────────────────────────────
  // Note: Ticket state is managed by React Query hook, SSE just updates scanState
  // Component will re-render when ticket is checked in (scanState updates the display)

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

  // ─── DigitalStub scan state mapping ──────────────────────────────────────────
  const stubScanState: 'idle' | 'used' | 'failed' =
    ticket?.status === 'used' ? 'used' : scanState === 'error' ? 'failed' : 'idle'

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px 80px' }}>
        <BackLink href="/tickets" marginBottom={24}>Back to Tickets</BackLink>

        {isLoading ? (
          <LoadingSpinner centered size="lg" />
        ) : !ticket ? (
          <EmptyState
            title="Ticket not found"
            action={{ label: 'Back to tickets', href: '/tickets' }}
          />
        ) : (
          <>
            {/* Digital stub — only render when event data is available */}
            {event && (
              <DigitalStub
                ticket={ticket}
                event={event}
                qrDataUrl={qrSrc ?? undefined}
                scanState={stubScanState}
              />
            )}

            {/* Gate Rules */}
            {event && event.gateRules && event.gateRules.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                }}
              >
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 10px' }}>
                  Gate Rules
                </h2>
                <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {event.gateRules.map((rule, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* View Event link */}
            {event && (
              <Link
                href={`/events/${event.slug ?? event._id}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: 16,
                  fontSize: 14,
                  color: 'var(--color-brand)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                View Event Details →
              </Link>
            )}

            {/* Used state overlay */}
            {ticket.status === 'used' && (
              <div
                style={{
                  marginTop: 16,
                  textAlign: 'center',
                  padding: '24px',
                  background: 'var(--color-surface)',
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">
                  ✅
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>
                  Entry Granted
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                    marginTop: 4,
                  }}
                >
                  You attended this event
                </p>
              </div>
            )}

            {/* Send to Friend */}
            {ticket.status === 'active' && (
              <div style={{ marginTop: 24 }}>
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
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 10,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                >
                  Send to Friend
                </button>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  Recipient must sign up to claim. Ticket returns to you after 48h if
                  unclaimed.
                </p>
              </div>
            )}

            {/* Offline fallback */}
            <p
              style={{
                marginTop: 24,
                fontSize: 12,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
              }}
            >
              Offline? Show this code at the gate:{' '}
              <strong style={{ color: 'var(--color-text)' }}>{ticket.reference}</strong>
            </p>
          </>
        )}
      </main>

      {/* Pulse keyframe */}
      <style>{`@keyframes __ct_pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }`}</style>
    </>
  )
}
