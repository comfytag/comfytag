'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type { Ticket, User } from '@comfytag/types'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { TicketWalletCard } from '@/components/tickets/TicketWalletCard'
import { FaceEnrollmentBanner } from '@/components/tickets/FaceEnrollmentBanner'
import { useMyTickets } from '@/hooks/useTickets'

type WalletTab = 'all' | 'upcoming' | 'past'

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { data: session, status } = useSession()
  const { data: tickets = [], isLoading } = useMyTickets()
  const [activeTab, setActiveTab] = useState<WalletTab>('all')

  const { data: profileData } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: () => api.get(`/users/${session!.user.id}`).then(r => r.data?.data ?? r.data),
    enabled: !!session?.user?.id,
    staleTime: 60_000,
  })

  const { data: faceEnrollmentBannerConfig } = useQuery<{ title?: string; body?: string } | null>({
    queryKey: ['cms-banner', 'face-enrollment'],
    queryFn: () =>
      api
        .get('/cms/banners?key=face-enrollment')
        .then((r) => (r.data?.data as Array<{ title?: string; body?: string }>)?.[0] ?? null),
    staleTime: 3_600_000,
  })

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

  // Build the exact end datetime for a ticket, accounting for overnight events
  // (e.g. a club night starting 21:00 and ending 05:00 the next morning).
  const buildEndDateTime = (t: Ticket): Date | null => {
    const rawDate = t.eventDate || t.date
    if (!rawDate) return null

    const base = new Date(rawDate)
    const startTime = t.eventTime
    const endTime   = t.eventEndTime

    if (!startTime || !endTime) {
      base.setHours(23, 59, 59, 999)
      return base
    }

    const [startH] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)

    const endDateTime = new Date(base)
    endDateTime.setHours(endH, endM, 0, 0)

    // Overnight check: end before start means event wraps past midnight.
    if (endH < startH) endDateTime.setDate(endDateTime.getDate() + 1)

    return endDateTime
  }

  const now = new Date()

  const upcoming = tickets.filter((t) => {
    const end = buildEndDateTime(t)
    return end ? now <= end : true
  })

  const past = tickets.filter((t) => {
    const end = buildEndDateTime(t)
    return end ? now > end : false
  })

  const bannerUser = {
    _id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    username: session.user.name,
    token: session.user.token,
    isPartner: session.user.isPartner,
    isAdmin: session.user.isAdmin,
    avatar: session.user.image,
    isVerify: { email: false, photo: false, idCard: false, address: false },
    onboarding: { completed: false },
    faceEnrolled: profileData?.faceEnrolled ?? false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as User

  const showFaceBanner = upcoming.length > 0 && !bannerUser.faceEnrolled

  const showUpcoming = (activeTab === 'all' || activeTab === 'upcoming') && upcoming.length > 0
  const showPast = (activeTab === 'all' || activeTab === 'past') && past.length > 0
  const tabHasNoResults =
    (activeTab === 'upcoming' && upcoming.length === 0) ||
    (activeTab === 'past' && past.length === 0)

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen bg-(--color-bg) pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Page Header ── */}
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-(--color-text) tracking-tight">Ticket Wallet</h1>
                {!isLoading && upcoming.length > 0 && (
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-(--color-brand-alpha-8) text-brand text-xs font-bold tabular-nums">
                    {upcoming.length} active
                  </span>
                )}
              </div>
              <p className="text-(--color-text-muted) mt-1">
                Manage your entries, past events, and digital access.
              </p>
            </div>

            {tickets.length > 0 && (
              <div className="flex gap-1 p-1 bg-(--color-surface-2) rounded-xl w-fit">
                {(
                  [
                    { value: 'all' as const, label: 'All Tickets' },
                    { value: 'upcoming' as const, label: 'Upcoming' },
                    { value: 'past' as const, label: 'Past' },
                  ]
                ).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    aria-pressed={activeTab === tab.value}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === tab.value
                        ? 'bg-(--color-surface) text-brand'
                        : 'text-(--color-text-muted) hover:text-(--color-text)'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </header>

          {/* ── Face Biometric Promo Banner ── */}
          {showFaceBanner && (
            <FaceEnrollmentBanner
              user={bannerUser}
              onDismiss={() => {}}
              title={faceEnrollmentBannerConfig?.title}
              body={faceEnrollmentBannerConfig?.body}
            />
          )}

          {/* ── Loading state ── */}
          {isLoading ? (
            <div className="mt-12">
              <LoadingSpinner size="lg" centered />
            </div>

          ) : tickets.length === 0 ? (
            /* ── Empty wallet placeholder ── */
            <div className="border-2 border-dashed border-(--color-border) rounded-2xl bg-(--color-surface) p-16 text-center flex flex-col items-center justify-center mt-8">
              <div className="w-16 h-16 rounded-2xl bg-(--color-surface-2) flex items-center justify-center mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-8 h-8 text-(--color-text-muted)"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-(--color-text) mb-2">Your wallet is currently empty.</p>
              <p className="text-sm text-(--color-text-muted) mb-6 max-w-xs leading-relaxed">
                Explore active vibes to book your next live pass.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Browse Events
              </Link>
            </div>

          ) : (
            /* ── Ticket bento grid ── */
            <div className="mt-2">

              {showUpcoming && (
                <section className={showPast && activeTab === 'all' ? 'mb-10' : ''}>
                  {activeTab === 'all' && (
                    <h2 className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) mb-4">
                      Upcoming
                    </h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {upcoming.map((t) => (
                      <TicketWalletCard key={t._id} ticket={t} />
                    ))}
                  </div>
                </section>
              )}

              {showPast && (
                <section>
                  {activeTab === 'all' && (
                    <h2 className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) mb-4">
                      Past
                    </h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {past.map((t) => (
                      <TicketWalletCard key={t._id} ticket={t} isPast />
                    ))}
                  </div>
                </section>
              )}

              {tabHasNoResults && (
                <p className="text-sm text-(--color-text-muted) text-center py-16">
                  {activeTab === 'upcoming' ? 'No upcoming tickets.' : 'No past tickets.'}
                </p>
              )}

            </div>
          )}

          {/* ── Become a Partner Banner (non-partners only) ── */}
          {!session.user.isPartner && (
            <div className="mt-12 rounded-2xl bg-(--color-brand-alpha-8) border border-brand-light px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-brand">Enjoyed attending?</p>
                <p className="text-sm text-(--color-text-muted) mt-0.5">Host your own event and sell tickets on ComfyTag.</p>
              </div>
              <Link
                href="/profile"
                className="shrink-0 inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Become a Partner →
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* ── Floating Action Button: claim a ticket by code ── */}
      {!isLoading && tickets.length > 0 && (
        <Link
          href="/claim-ticket"
          aria-label="Add ticket by code"
          className="group fixed right-6 sm:right-8 bottom-[calc(64px+env(safe-area-inset-bottom)+20px)] md:bottom-8 w-14 h-14 sm:w-16 sm:h-16 bg-brand text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 no-underline"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-90" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-(--color-text) text-(--color-bg) px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
            Add Ticket Code
          </span>
        </Link>
      )}
    </>
  )
}
