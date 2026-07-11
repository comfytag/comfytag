'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Ticket, User } from '@comfytag/types'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { TicketListItem } from '@/components/tickets/TicketListItem'
import { FaceEnrollmentBanner } from '@/components/tickets/FaceEnrollmentBanner'
import { useMyTickets } from '@/hooks/useTickets'

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: tickets = [], isLoading } = useMyTickets()

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

  const handleTicketAction = (
    action: 'show-qr' | 'transfer' | 'details',
    ticket: Ticket
  ): void => {
    if (action === 'transfer') {
      router.push(`/tickets/${ticket._id}/transfer`)
    } else {
      router.push(`/tickets/${ticket._id}`)
    }
  }

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen bg-zinc-50/50 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">

          {/* ── Page Header ── */}
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">My Wallet</h1>
            {!isLoading && upcoming.length > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold tabular-nums">
                {upcoming.length} active
              </span>
            )}
          </div>

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
            <div className="border-2 border-dashed border-zinc-200 rounded-2xl bg-white p-16 text-center flex flex-col items-center justify-center mt-8">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-8 h-8 text-zinc-400"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-zinc-700 mb-2">Your wallet is currently empty.</p>
              <p className="text-sm text-zinc-500 mb-6 max-w-xs leading-relaxed">
                Explore active vibes to book your next live pass.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                Browse Events
              </Link>
            </div>

          ) : (
            /* ── Ticket pass list ── */
            <div className="space-y-4 mt-8">

              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                    Upcoming Passes
                  </h2>
                  <div className="space-y-3">
                    {upcoming.map((t) => (
                      <TicketListItem key={t._id} ticket={t} onAction={handleTicketAction} />
                    ))}
                  </div>
                </section>
              )}

              {past.length > 0 && (
                <section className={upcoming.length > 0 ? 'mt-8' : ''}>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                    Past Passes
                  </h2>
                  <div className="space-y-3">
                    {past.map((t) => (
                      <TicketListItem key={t._id} ticket={t} isPast onAction={handleTicketAction} />
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}

          {/* ── Become a Partner Banner (non-partners only) ── */}
          {!session.user.isPartner && (
            <div className="mt-12 rounded-2xl bg-violet-50 border border-violet-200 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-violet-900">Enjoyed attending?</p>
                <p className="text-sm text-violet-700 mt-0.5">Host your own event and sell tickets on ComfyTag.</p>
              </div>
              <Link
                href="/profile"
                className="shrink-0 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
              >
                Become a Partner →
              </Link>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
