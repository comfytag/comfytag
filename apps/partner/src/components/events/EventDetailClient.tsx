'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronRight,
  User,
  CheckCircle2,
} from 'lucide-react'
import { ErrorMessage } from '@comfytag/ui'
import type { Event, TierStats } from '@comfytag/types'
import { formatDate, formatNaira } from '@comfytag/utils'
import { Sheet } from '@/components/ui/Sheet'
import { AttendeesSection } from './AttendeesSection'
import { EventRecapSection } from './EventRecapSection'
import { api } from '@/lib/api'

interface TierStatsResponse {
  tiers: TierStats[]
}

interface EventDetailClientProps {
  event: Event
  eventId: string
  tierStats: TierStatsResponse | null
}

type EventStatus = Event['status']

interface StatusConfig {
  label: string
  pill: string
}

const STATUS_CONFIG: Record<EventStatus, StatusConfig> = {
  published: {
    label: 'LIVE',
    pill: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  draft: {
    label: 'DRAFT',
    pill: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
  },
  cancelled: {
    label: 'CANCELLED',
    pill: 'bg-red-100 text-red-600 border border-red-200',
  },
  ended: {
    label: 'ENDED',
    pill: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
  },
}

const DUMMY_ACTIVITY = [
  { id: 1, type: 'purchase', user: 'Sarah K.', action: 'purchased VIP', time: '2m ago' },
  { id: 2, type: 'checkin',  user: 'Mike O.',  action: 'checked in',    time: '5m ago' },
  { id: 3, type: 'purchase', user: 'Adaeze N.', action: 'purchased General', time: '8m ago' },
  { id: 4, type: 'checkin',  user: 'Chukwuma B.', action: 'checked in', time: '12m ago' },
  { id: 5, type: 'purchase', user: 'Fatima L.', action: 'purchased Table', time: '15m ago' },
]

export function EventDetailClient({ event, eventId, tierStats }: EventDetailClientProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [currentStatus, setCurrentStatus] = useState<EventStatus>(event.status)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [isTiersSheetOpen, setIsTiersSheetOpen]   = useState(false)

  const statusMutation = useMutation({
    mutationFn: (status: 'published' | 'draft' | 'cancelled') => {
      if (status === 'published') {
        return api.post(`/events/${eventId}/publish`).then(r => r.data)
      }
      if (status === 'cancelled') {
        return api.post(`/events/${eventId}/cancel`).then(r => r.data)
      }
      return api.patch(`/events/${eventId}`, { status }).then(r => r.data)
    },
    onSuccess: (_data, status) => {
      setCurrentStatus(status)
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', session?.user?.id] })
    },
    onError: () => {
      setErrorMessage('Failed to update event status. Please try again.')
    },
  })

  const liveEvent   = { ...event, status: currentStatus }
  const statusCfg   = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.draft
  const tiers       = tierStats?.tiers ?? []
  const totalSold   = event.sold ?? 0
  const totalCap    = (event.ticketType ?? []).reduce((s, t) => s + t.capacity, 0)
  const coverImage  = event.coverImage ?? event.images?.[0]

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-24 px-4 sm:px-6 lg:px-8 space-y-8">

      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/events"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors w-fit"
        >
          <ArrowLeft size={15} />
          Back to Events
        </Link>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-black text-zinc-900 leading-tight">
            {liveEvent.name || 'Untitled Event'}
          </h1>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-widest ${statusCfg.pill}`}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      {errorMessage && (
        <ErrorMessage message={errorMessage} onRetry={() => setErrorMessage(null)} />
      )}

      {/* ── Main Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ─────────────────────────────────────────────────────────────
            DIGITAL TICKET OBJECT  (left · 7 cols)
        ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-zinc-200 shadow-xl rounded-3xl overflow-hidden">

            {/* TOP HALF — Event Details (click to edit) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsDetailsSheetOpen(true)}
              onKeyDown={e => e.key === 'Enter' && setIsDetailsSheetOpen(true)}
              className="group relative hover:bg-zinc-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {/* Hover glow ring */}
              <div className="absolute inset-0 rounded-t-3xl ring-0 group-hover:ring-2 group-hover:ring-violet-400/30 transition-all pointer-events-none" />

              {/* Cover image / placeholder */}
              {coverImage ? (
                <div className="relative w-full h-56 overflow-hidden">
                  <Image
                    src={coverImage}
                    alt={liveEvent.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                </div>
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center select-none">
                  <span className="text-8xl font-black text-violet-200">
                    {liveEvent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Text details */}
              <div className="px-7 pt-5 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-zinc-900">{liveEvent.name}</h2>
                    <p className="text-sm text-zinc-500">
                      {liveEvent.date ? formatDate(liveEvent.date) : 'Date TBA'}
                      {' · '}
                      {liveEvent.startTime || '—'} – {liveEvent.endTime || '—'}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {liveEvent.venue || 'Venue TBA'}
                      {liveEvent.address ? `, ${liveEvent.address}` : ''}
                      {liveEvent.state ? `, ${liveEvent.state}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-violet-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    <span>Edit details</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            </div>

            {/* PERFORATED TEAR-LINE DIVIDER */}
            <div className="relative px-4">
              <div className="border-b-2 border-dashed border-zinc-200" />
              {/* Notch circles */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-50 border border-zinc-200" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-slate-50 border border-zinc-200" />
            </div>

            {/* BOTTOM HALF — Ticket Tiers (click to manage) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsTiersSheetOpen(true)}
              onKeyDown={e => e.key === 'Enter' && setIsTiersSheetOpen(true)}
              className="group hover:bg-zinc-50 transition-colors cursor-pointer px-7 pt-5 pb-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                  Ticket Tiers
                </span>
                <div className="flex items-center gap-1 text-xs text-violet-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Manage tiers</span>
                  <ChevronRight size={13} />
                </div>
              </div>

              {tiers.length > 0 ? (
                <div className="space-y-4">
                  {tiers.map((tier) => (
                    <TierRow
                      key={tier._id}
                      name={tier.name}
                      sold={tier.sold}
                      capacity={tier.capacity}
                      price={tier.price}
                      pct={tier.soldPercentage}
                    />
                  ))}
                </div>
              ) : (event.ticketType ?? []).length > 0 ? (
                <div className="space-y-4">
                  {(event.ticketType ?? []).map((tier) => (
                    <TierRow
                      key={tier._id}
                      name={tier.name}
                      sold={0}
                      capacity={tier.capacity}
                      price={tier.price}
                      pct={0}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center py-5">No tiers configured yet</p>
              )}

              {totalCap > 0 && (
                <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">Total sold</span>
                  <span className="text-sm font-bold text-zinc-800">
                    {totalSold.toLocaleString('en-NG')}
                    <span className="text-zinc-400 font-normal">
                      {' '}/ {totalCap.toLocaleString('en-NG')}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            COMMAND BOARD  (right · 5 cols)
        ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-5">

          {/* Quick Actions — 2 × 2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <QuickAction href={`/events/${eventId}/gate`} emoji="🔴" label="Activate Gate" />
            <QuickAction href={`/events/${eventId}/analytics`} emoji="📊" label="Analytics" />
            <QuickAction emoji="📣" label="Promote" disabled />
            <QuickAction href={`/events/${eventId}/promos`} emoji="🎁" label="Create Promo" />
          </div>

          {/* Status Controls */}
          {currentStatus !== 'cancelled' && currentStatus !== 'ended' && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Status Controls
              </span>
              <div className="flex flex-col gap-2">
                {currentStatus === 'draft' && (
                  <button
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate('published')}
                    className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {statusMutation.isPending ? 'Publishing…' : 'Publish Event'}
                  </button>
                )}
                {currentStatus === 'published' && (
                  <button
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate('draft')}
                    className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {statusMutation.isPending ? 'Updating…' : 'Move to Draft'}
                  </button>
                )}
                <button
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate('cancelled')}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 border border-red-200 cursor-pointer"
                >
                  {statusMutation.isPending ? 'Cancelling…' : 'Cancel Event'}
                </button>
              </div>
            </div>
          )}

          {/* Live Activity Feed */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Live Activity
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-4">
              {DUMMY_ACTIVITY.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === 'purchase' ? 'bg-violet-50' : 'bg-emerald-50'
                    }`}
                  >
                    {item.type === 'purchase' ? (
                      <User size={14} className="text-violet-600" />
                    ) : (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800 truncate">
                      <span className="font-semibold">{item.user}</span>{' '}
                      <span className="text-zinc-500">{item.action}</span>
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Attendees + Recap (preserved, below grid) ────────────────── */}
      <AttendeesSection eventId={eventId} />
      {event.status === 'ended' && <EventRecapSection eventId={eventId} />}

      {/* ── Slide-out Sheets ─────────────────────────────────────────── */}
      <Sheet
        open={isDetailsSheetOpen}
        onClose={() => setIsDetailsSheetOpen(false)}
        title="Edit Event Details"
      />
      <Sheet
        open={isTiersSheetOpen}
        onClose={() => setIsTiersSheetOpen(false)}
        title="Manage Ticket Tiers"
      />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface TierRowProps {
  name: string
  sold: number
  capacity: number
  price: number
  pct: number
}

function TierRow({ name, sold, capacity, price, pct }: TierRowProps) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm font-semibold text-zinc-800">{name}</span>
        <span className="text-xs text-zinc-400">
          {sold}/{capacity} · {formatNaira(price)}
        </span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-600 rounded-full transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}

interface QuickActionProps {
  emoji: string
  label: string
  href?: string
  disabled?: boolean
}

function QuickAction({ emoji, label, href, disabled = false }: QuickActionProps) {
  const inner = (
    <div
      className={`flex flex-col items-center gap-2 bg-white border border-zinc-200 rounded-2xl p-5 transition-all group
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-violet-300 hover:shadow-md cursor-pointer'
        }`}
    >
      <span className="text-2xl select-none">{emoji}</span>
      <span
        className={`text-sm font-bold text-zinc-800 text-center leading-tight ${
          disabled ? '' : 'group-hover:text-violet-700 transition-colors'
        }`}
      >
        {label}
      </span>
    </div>
  )

  if (href && !disabled) {
    return <Link href={href} className="block">{inner}</Link>
  }
  return <div>{inner}</div>
}
