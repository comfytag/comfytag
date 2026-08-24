'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatNaira } from '@comfytag/utils'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { usePartnerProfile, usePartnerRevenue, usePartnerAnalytics, useMyEvents } from '@/hooks'
import { TicketPulseRing } from '@/components/overview/TicketPulseRing'
import { MilestoneTrack } from '@/components/overview/MilestoneTrack'
import { EventTimelineStrip } from '@/components/overview/EventTimelineStrip'

// ── Private helpers ────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target <= 0) {
      setValue(0)
      return
    }
    let rafId: number
    let startTime: number | null = null

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return value
}

// ── Skeleton placeholder ───────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-xl bg-zinc-800" />
        <div className="h-4 w-72 rounded-lg bg-zinc-900" />
      </div>
      {/* Hero grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 rounded-xl bg-zinc-900 border border-zinc-800" />
        <div className="h-64 rounded-xl bg-zinc-900 border border-zinc-800" />
      </div>
      {/* Chip row skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-zinc-900 border border-zinc-800" />
        ))}
      </div>
      {/* Milestone skeleton */}
      <div className="h-28 rounded-2xl bg-zinc-900 border border-zinc-800" />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { data: session } = useSession()

  // ── Data hooks — ALL PRESERVED, identical signatures ──────────────────────
  const {
    data: organizer,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = usePartnerProfile()

  const {
    data: revenue,
    isLoading: revenueLoading,
    isError: revenueError,
    refetch: refetchRevenue,
  } = usePartnerRevenue()

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = usePartnerAnalytics()

  const {
    data: events = [],
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents,
  } = useMyEvents()

  // ── Derived values ─────────────────────────────────────────────────────────

  const organizerName = toTitleCase(
    organizer?.name ?? session?.user?.name ?? 'Organizer'
  )

  const upcomingEvents = events
    .filter((e) => new Date(e.date) > new Date() || e.status === 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8)

  const today = new Date().toDateString()
  const ticketsSoldToday = events
    .filter((e) => new Date(e.date).toDateString() === today)
    .reduce((sum, e) => sum + (e.sold ?? 0), 0)

  const totalCapacity = events.reduce(
    (sum, e) => sum + e.ticketType.reduce((s, t) => s + t.capacity, 0),
    0
  )

  const totalRevenue = revenue?.totalRevenue ?? 0
  const availableBalance = revenue?.availableBalance ?? 0
  const totalTicketsSold = revenue?.totalTicketsSold ?? 0
  const totalEvents = revenue?.totalEvents ?? 0
  const followers = analytics?.followers ?? 0

  // Count-up animated values
  const animRevenue = useCountUp(totalRevenue, 1400)
  const animBalance = useCountUp(availableBalance, 1200)

  // ── States ─────────────────────────────────────────────────────────────────

  const isLoading = profileLoading || revenueLoading || analyticsLoading || eventsLoading

  if (isLoading) {
    return (
      <div className="py-2">
        <OverviewSkeleton />
      </div>
    )
  }

  if (profileError || revenueError || analyticsError || eventsError) {
    return (
      <div className="py-8">
        <ErrorMessage
          message="Failed to load dashboard data. Please try again."
          onRetry={() => {
            refetchProfile()
            refetchRevenue()
            refetchAnalytics()
            refetchEvents()
          }}
        />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <header>
        <h1 className="text-2xl font-black text-(--color-text) tracking-tight leading-tight">
          {getGreeting()}, {organizerName}.
        </h1>
        <p className="mt-1 text-sm text-(--color-text-muted)">
          Your studio ecosystem is fully operational.
        </p>
      </header>

      {/* ── 2. Revenue Hero + Pulse Ring ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Hero Card — spans 2 cols */}
        <div
          className="card-enter lg:col-span-2 relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-white"
        >
          {/* Content */}
          <div className="relative z-10 flex flex-col h-full gap-6">
            {/* Label */}
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-amber-400"
              />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Total Revenue
              </span>
            </div>

            {/* Big revenue figure */}
            <div>
              <p className="text-5xl font-black text-zinc-50 leading-none tracking-tight tabular-nums">
                {formatNaira(animRevenue)}
              </p>
              <p className="mt-2 text-sm text-zinc-400">All-time earnings across all events</p>
            </div>

            {/* Sub-stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800">
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Available
                </p>
                <p className="text-lg font-black text-amber-400 tabular-nums">
                  {formatNaira(animBalance)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Pending
                </p>
                <p className="text-lg font-black text-zinc-300 tabular-nums">
                  {formatNaira(revenue?.pendingWithdrawals ?? 0)}
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Paid Out
                </p>
                <p className="text-lg font-black text-zinc-300 tabular-nums">
                  {formatNaira(revenue?.sentWithdrawals ?? 0)}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div>
              <Link
                href="/payouts"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                Manage payouts
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Ticket Pulse Ring — spans 1 col */}
        <div
          className="card-enter bg-(--color-surface) border border-(--color-border) rounded-xl p-8 flex flex-col items-center justify-center text-center relative"
          style={{ animationDelay: '60ms' }}
        >
          <TicketPulseRing count={ticketsSoldToday} label="Tickets Today" />
        </div>
      </div>

      {/* ── 3. Metric Milestone Chips ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Events */}
        <div
          className="card-enter bg-(--color-surface) border border-(--color-border) rounded-xl p-5 flex items-center gap-3 hover:border-zinc-700 transition-colors"
          style={{ animationDelay: '100ms' }}
        >
          <div className="w-10 h-10 rounded-xl bg-violet-950/40 border border-violet-900/50 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black text-(--color-text) leading-none tabular-nums">
              {totalEvents.toLocaleString('en-NG')}
            </p>
            <p className="mt-0.5 text-xs text-(--color-text-muted) font-medium">Total Events</p>
          </div>
        </div>

        {/* Followers */}
        <div
          className="card-enter bg-(--color-surface) border border-(--color-border) rounded-xl p-5 flex items-center gap-3 hover:border-zinc-700 transition-colors"
          style={{ animationDelay: '140ms' }}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-900/50 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black text-(--color-text) leading-none tabular-nums">
              {followers.toLocaleString('en-NG')}
            </p>
            <p className="mt-0.5 text-xs text-(--color-text-muted) font-medium">Followers</p>
          </div>
        </div>

        {/* Tickets Sold */}
        <div
          className="card-enter bg-(--color-surface) border border-(--color-border) rounded-xl p-5 flex items-center gap-3 hover:border-zinc-700 transition-colors"
          style={{ animationDelay: '180ms' }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400" aria-hidden="true">
              <path d="M22 12.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5c1.1 0 2 .9 2 2s-.9 2-2 2v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.5" />
              <polyline points="16 8 9 15 6 12" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black text-(--color-text) leading-none tabular-nums">
              {totalTicketsSold.toLocaleString('en-NG')}
            </p>
            <p className="mt-0.5 text-xs text-(--color-text-muted) font-medium">Tickets Sold</p>
          </div>
        </div>
      </div>

      {/* ── 4. Milestone Progress Rail ─────────────────────────────────────── */}
      <div
        className="card-enter bg-(--color-surface) border border-(--color-border) rounded-xl p-5"
        style={{ animationDelay: '220ms' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-(--color-text) tracking-tight">
              Your Progress
            </h2>
            <p className="text-xs text-(--color-text-muted) mt-0.5">
              {totalTicketsSold.toLocaleString('en-NG')} tickets sold all-time
            </p>
          </div>
          <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/50 rounded-full px-3 py-1">
            Level up
          </span>
        </div>
        <MilestoneTrack
          ticketsSold={totalTicketsSold}
          totalCapacity={totalCapacity || undefined}
        />
      </div>

      {/* ── 5. Live Event Timeline ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-(--color-text) tracking-tight uppercase tracking-wider">
            Your Events
          </h2>
          <Link
            href="/events/create"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-950/40 hover:bg-violet-900/50 border border-violet-900/50 rounded-full px-3 py-1.5 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Event
          </Link>
        </div>

        <EventTimelineStrip events={upcomingEvents} />

        {events.length > 8 && (
          <div className="mt-4 text-center">
            <Link
              href="/events"
              className="text-sm font-semibold text-(--color-text-muted) hover:text-(--color-text) transition-colors"
            >
              View all {events.length} events →
            </Link>
          </div>
        )}
      </section>

    </div>
  )
}
