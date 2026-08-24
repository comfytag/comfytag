'use client'

import { useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Megaphone,
  Pencil,
  Plus,
  Tag,
  Ticket,
  Trash2,
  User,
} from 'lucide-react'
import { ErrorMessage } from '@comfytag/ui'
import type { Event, TierStats } from '@comfytag/types'
import { EVENT_CATEGORIES, NIGERIAN_STATES, formatDate, formatNaira } from '@comfytag/utils'
import { Sheet } from '@/components/ui/Sheet'
import { AttendeesSection } from './AttendeesSection'
import { EventRecapSection } from './EventRecapSection'
import { api } from '@/lib/api'
import { useUpdateTier, useDeleteTier, useAddTier } from '@/hooks/useEvents'
import { partnerEventKeys } from '@/hooks/queryKeys'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EventStatus, StatusConfig> = {
  published: {
    label: 'LIVE',
    pill: 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50',
  },
  draft: {
    label: 'DRAFT',
    pill: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  },
  cancelled: {
    label: 'CANCELLED',
    pill: 'bg-red-950/40 text-red-400 border border-red-900/50',
  },
  ended: {
    label: 'ENDED',
    pill: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  },
}

interface ActivityItem {
  id: string
  type: 'purchase' | 'checkin'
  user: string
  action: string
  timestamp: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Shared premium field styles used inside both Sheet forms
const sheetLabel =
  'block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5'
const sheetInput =
  'w-full bg-(--color-surface) border-2 border-(--color-border) focus:border-violet-600 rounded-xl px-4 py-3 text-sm text-(--color-text) placeholder:text-zinc-500 focus:outline-none transition-colors'
const sheetSelect =
  'w-full appearance-none bg-(--color-surface) border-2 border-(--color-border) focus:border-violet-600 rounded-xl px-4 py-3 pr-10 text-sm text-(--color-text) focus:outline-none transition-colors cursor-pointer'

// ── Main Component ────────────────────────────────────────────────────────────

export function EventDetailClient({ event, eventId, tierStats }: EventDetailClientProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [currentStatus, setCurrentStatus] = useState<EventStatus>(event.status)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [isTiersSheetOpen, setIsTiersSheetOpen]   = useState(false)

  const { data: activityData } = useQuery<{ activity: ActivityItem[] }>({
    queryKey: ['event-activity', eventId],
    queryFn: () => api.get(`/events/${eventId}/activity`).then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
    enabled: !!session?.user?.token,
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'published' | 'draft' | 'cancelled') => {
      const headers = { Authorization: `Bearer ${session?.user?.token}` }
      if (status === 'published') {
        return api.post(`/events/${eventId}/publish`, undefined, { headers }).then(r => r.data)
      }
      if (status === 'cancelled') {
        return api.post(`/events/${eventId}/cancel`, undefined, { headers }).then(r => r.data)
      }
      return api.patch(`/events/${eventId}`, { status }, { headers }).then(r => r.data)
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

  const liveEvent  = { ...event, status: currentStatus }
  const statusCfg  = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.draft
  const tiers      = tierStats?.tiers ?? []
  const totalSold  = event.sold ?? 0
  const totalCap   = (event.ticketType ?? []).reduce((s, t) => s + t.capacity, 0)
  const coverImage = event.coverImage ?? event.images?.[0]

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6 lg:px-8 space-y-8 max-w-5xl mx-auto">

      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/events"
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-(--color-text) transition-colors w-fit"
        >
          <ArrowLeft size={15} />
          Back to Events
        </Link>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-black text-(--color-text) leading-tight">
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

        {/* ── Digital Ticket Object (left · 7 cols) ────────────────── */}
        <div className="lg:col-span-7">
          <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden">

            {/* TOP HALF — Event Details (click to edit) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsDetailsSheetOpen(true)}
              onKeyDown={e => e.key === 'Enter' && setIsDetailsSheetOpen(true)}
              className="group relative hover:bg-zinc-800/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
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
                  {/* Multi-image dot indicator */}
                  {(event.images?.length ?? 0) > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                      {event.images!.slice(0, 5).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-full ${i === 0 ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-violet-950/60 to-zinc-900 flex items-center justify-center select-none">
                  <span className="text-8xl font-black text-violet-900">
                    {liveEvent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Text details */}
              <div className="px-7 pt-5 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-(--color-text)">{liveEvent.name}</h2>
                    <p className="text-sm text-zinc-400">
                      {liveEvent.date ? formatDate(liveEvent.date) : 'Date TBA'}
                      {' · '}
                      {liveEvent.startTime || '—'} – {liveEvent.endTime || '—'}
                    </p>
                    <p className="text-sm text-zinc-400">
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
              <div className="border-b-2 border-dashed border-zinc-700" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-(--color-bg) border border-(--color-border)" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-(--color-bg) border border-(--color-border)" />
            </div>

            {/* BOTTOM HALF — Ticket Tiers (click to manage) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsTiersSheetOpen(true)}
              onKeyDown={e => e.key === 'Enter' && setIsTiersSheetOpen(true)}
              className="group hover:bg-zinc-800/50 transition-colors cursor-pointer px-7 pt-5 pb-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">
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

        {/* ── Command Board (right · 5 cols) ───────────────────────── */}
        <div className="lg:col-span-5 space-y-5">

          {/* Quick Actions — 2 × 2 grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <QuickAction
              href={`/events/${eventId}/gate`}
              icon={<Ticket className="w-5 h-5 text-[#FE3503] shrink-0" strokeWidth={2.4} />}
              label="Activate Gate"
            />
            <QuickAction
              href={`/events/${eventId}/analytics`}
              icon={<BarChart2 className="w-5 h-5 text-blue-600 shrink-0" strokeWidth={2.4} />}
              label="Analytics"
            />
            <QuickAction
              icon={<Megaphone className="w-5 h-5 text-zinc-400 shrink-0" strokeWidth={2.4} />}
              label="Promote"
              disabled
            />
            <QuickAction
              href={`/events/${eventId}/promos`}
              icon={<Tag className="w-5 h-5 text-violet-400 shrink-0" strokeWidth={2.4} />}
              label="Create Promo"
            />
          </div>

          {/* Status Controls */}
          {currentStatus !== 'cancelled' && currentStatus !== 'ended' && (
            <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-5 sm:p-6">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-4 block">
                STATUS CONTROLS
              </span>
              <div className="flex flex-col gap-3">
                <Link
                  href={`/events/${eventId}/edit`}
                  className="w-full bg-violet-600 text-white font-bold py-3 rounded-full hover:bg-violet-700 active:scale-95 transition-all text-[13px] sm:text-sm flex justify-center items-center gap-2 mb-3"
                >
                  <Pencil className="w-4 h-4" strokeWidth={2.4} />
                  Edit Event
                </Link>
                {currentStatus === 'draft' && (
                  <button
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate('published')}
                    className="w-full bg-zinc-800 text-zinc-200 font-bold py-3 rounded-full hover:bg-zinc-700 transition-all text-[13px] sm:text-sm flex justify-center disabled:opacity-50 cursor-pointer"
                  >
                    {statusMutation.isPending ? 'Publishing…' : 'Publish Event'}
                  </button>
                )}
                {currentStatus === 'published' && (
                  <button
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate('draft')}
                    className="w-full bg-zinc-800 text-zinc-200 font-bold py-3 rounded-full hover:bg-zinc-700 transition-all text-[13px] sm:text-sm flex justify-center disabled:opacity-50 cursor-pointer"
                  >
                    {statusMutation.isPending ? 'Updating…' : 'Move to Draft'}
                  </button>
                )}
                <button
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate('cancelled')}
                  className="w-full bg-red-950/40 text-red-400 font-bold py-3 rounded-full border border-red-900/50 hover:bg-red-950/60 transition-all text-[13px] sm:text-sm flex justify-center disabled:opacity-50 cursor-pointer"
                >
                  {statusMutation.isPending ? 'Cancelling…' : 'Cancel Event'}
                </button>
              </div>
            </div>
          )}

          {/* Live Activity Feed */}
          <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                Live Activity
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-4">
              {activityData?.activity && activityData.activity.length > 0 ? (
                activityData.activity.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        item.type === 'purchase' ? 'bg-violet-950/40' : 'bg-emerald-950/40'
                      }`}
                    >
                      {item.type === 'purchase' ? (
                        <User size={14} className="text-violet-400" />
                      ) : (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">
                        <span className="font-semibold">{item.user}</span>{' '}
                        <span className="text-zinc-400">{item.action}</span>
                      </p>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">{timeAgo(item.timestamp)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">No activity yet</p>
              )}
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
      >
        <EditDetailsForm
          event={event}
          eventId={eventId}
          onClose={() => setIsDetailsSheetOpen(false)}
        />
      </Sheet>

      <Sheet
        open={isTiersSheetOpen}
        onClose={() => setIsTiersSheetOpen(false)}
        title="Manage Ticket Tiers"
      >
        <EditTiersForm event={event} eventId={eventId} />
      </Sheet>
    </div>
  )
}

// ── TierRow ───────────────────────────────────────────────────────────────────

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
        <span className="text-sm font-semibold text-zinc-200">{name}</span>
        <span className="text-xs text-zinc-500">
          {sold}/{capacity} · {formatNaira(price)}
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-600 rounded-full transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  )
}

// ── QuickAction ───────────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: ReactNode
  label: string
  href?: string
  disabled?: boolean
}

function QuickAction({ icon, label, href, disabled = false }: QuickActionProps) {
  const inner = (
    <div
      className={`flex flex-row items-center justify-start gap-3 bg-(--color-surface) border border-(--color-border) rounded-xl p-4 sm:p-5 transition-all
        ${disabled
          ? 'opacity-40 grayscale pointer-events-none'
          : 'hover:border-zinc-700 active:scale-95 cursor-pointer'
        }`}
    >
      {icon}
      <span className="text-[13px] sm:text-sm font-bold text-zinc-200 leading-none">
        {label}
      </span>
    </div>
  )

  if (href && !disabled) {
    return <Link href={href} className="block">{inner}</Link>
  }
  return <div>{inner}</div>
}

// ── SheetSelectChevron ────────────────────────────────────────────────────────

function SheetSelectChevron() {
  return (
    <svg
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

// ── EditDetailsForm ───────────────────────────────────────────────────────────

interface EditDetailsFormProps {
  event: Event
  eventId: string
  onClose: () => void
}

function EditDetailsForm({ event, eventId, onClose }: EditDetailsFormProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name:      event.name ?? '',
    headline:  event.headline ?? '',
    category:  event.category ?? '',
    description: event.description ?? '',
    date:      event.date ? new Date(event.date).toISOString().split('T')[0] : '',
    startTime: event.startTime ?? '',
    endTime:   event.endTime ?? '',
    venue:     event.venue ?? '',
    address:   event.address ?? '',
    state:     event.state ?? '',
  })
  const [images, setImages] = useState<string[]>(
    (event.images ?? []).length > 0
      ? event.images!
      : event.coverImage
        ? [event.coverImage]
        : []
  )
  const [performers, setPerformers] = useState<string[]>(
    event.performers?.map(p => (typeof p === 'string' ? p : p.name)) ?? []
  )
  const [performerInput, setPerformerInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch(`/events/${eventId}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.detail(eventId) })
      qc.invalidateQueries({ queryKey: partnerEventKeys.list() })
      router.refresh()
      onClose()
    },
    onError: () => setFormError('Failed to save changes. Please try again.'),
  })

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post<{ url: string }>('/upload', fd)
    return res.data.url
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadFile(f)))
      setImages(prev => [...prev, ...urls].slice(0, 10))
    } catch {
      setFormError('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function addPerformer() {
    const name = performerInput.trim()
    if (!name) return
    setPerformers(p => [...p, name])
    setPerformerInput('')
  }

  function handleSubmit() {
    if (!form.name.trim())        { setFormError('Event name is required'); return }
    if (!form.description.trim()) { setFormError('Description is required'); return }
    setFormError('')
    updateMutation.mutate({
      ...form,
      images,
      coverImage: images[0] ?? event.coverImage,
      performers: performers.length > 0 ? performers : undefined,
    })
  }

  return (
    <div className="space-y-5">

      {/* Name */}
      <div>
        <label className={sheetLabel}>
          Event Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Summer Festival 2025"
          className={sheetInput}
        />
      </div>

      {/* Headline */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="sheet-headline" className={sheetLabel}>
            Headline <span className="text-zinc-400 font-normal normal-case">(optional)</span>
          </label>
          <button
            type="button"
            onClick={() => console.log('AI enhance headline')}
            className="text-xs font-bold text-violet-400 bg-violet-950/40 px-2 py-1 rounded-full hover:bg-violet-900/50 transition-colors cursor-pointer"
          >
            ✨ Enhance
          </button>
        </div>
        <input
          id="sheet-headline"
          type="text"
          value={form.headline}
          onChange={e => setForm({ ...form, headline: e.target.value })}
          placeholder="e.g. Lagos's biggest music festival is back."
          maxLength={150}
          className={sheetInput}
        />
        <p className="text-[11px] text-zinc-400 mt-1 text-right tabular-nums">
          {form.headline.length}/150
        </p>
      </div>

      {/* Category + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={sheetLabel}>Category</label>
          <div className="relative">
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className={sheetSelect}
            >
              <option value="">Select</option>
              {EVENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <SheetSelectChevron />
          </div>
        </div>
        <div>
          <label className={sheetLabel}>
            Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className={sheetInput}
          />
        </div>
      </div>

      {/* Start + End time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={sheetLabel}>Start Time</label>
          <input
            type="time"
            value={form.startTime}
            onChange={e => setForm({ ...form, startTime: e.target.value })}
            className={sheetInput}
          />
        </div>
        <div>
          <label className={sheetLabel}>End Time</label>
          <input
            type="time"
            value={form.endTime}
            onChange={e => setForm({ ...form, endTime: e.target.value })}
            className={sheetInput}
          />
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className={sheetLabel}>Venue</label>
        <input
          type="text"
          value={form.venue}
          onChange={e => setForm({ ...form, venue: e.target.value })}
          placeholder="e.g. Eko Hotel & Suites"
          className={sheetInput}
        />
      </div>

      {/* Address + State */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={sheetLabel}>Address</label>
          <input
            type="text"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className={sheetInput}
          />
        </div>
        <div>
          <label className={sheetLabel}>State</label>
          <div className="relative">
            <select
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
              className={sheetSelect}
            >
              <option value="">Select</option>
              {NIGERIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <SheetSelectChevron />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={sheetLabel}>
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Tell attendees what this event is about…"
          rows={4}
          className={`${sheetInput} resize-none`}
        />
      </div>

      {/* Performers */}
      <div>
        <label className={sheetLabel}>Performers / Lineup</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={performerInput}
            onChange={e => setPerformerInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPerformer() } }}
            placeholder="Name, then Enter"
            className={`${sheetInput} flex-1`}
          />
          <button
            type="button"
            onClick={addPerformer}
            className="px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Add
          </button>
        </div>
        {performers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {performers.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 bg-violet-950/40 text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-900/50"
              >
                {p}
                <button
                  type="button"
                  onClick={() => setPerformers(performers.filter((_, j) => j !== i))}
                  aria-label={`Remove ${p}`}
                  className="text-violet-400 hover:text-red-500 transition-colors leading-none focus-visible:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div>
        <label className={sheetLabel}>Event Images</label>

        {/* Thumbnail strip */}
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-0.5 px-0.5">
            {images.map((url, i) => (
              <div key={url} className="relative shrink-0 group">
                {i === 0 && (
                  <span className="absolute top-1 left-1 z-10 bg-violet-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider pointer-events-none">
                    Cover
                  </span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Event image ${i + 1}`}
                  className="w-24 h-16 object-cover rounded-lg border-2 border-(--color-border) group-hover:border-violet-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setImages(images.filter(u => u !== url))}
                  aria-label="Remove image"
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload trigger */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading || images.length >= 10}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-zinc-700 hover:border-violet-400 rounded-xl py-5 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-400 hover:text-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              {images.length === 0 ? 'Upload images' : `Add more (${images.length}/10)`}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {formError && <ErrorMessage message={formError} />}

      {/* Footer actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 border-2 border-(--color-border) text-zinc-300 text-sm font-bold rounded-2xl hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={updateMutation.isPending || uploading}
          className="flex-1 py-3 px-4 bg-violet-600 text-white text-sm font-bold rounded-2xl hover:bg-violet-700 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ── EditTiersForm ─────────────────────────────────────────────────────────────

interface EditTiersFormProps {
  event: Event
  eventId: string
}

interface TierEditState {
  _id: string
  name: string
  price: string
  capacity: string
  dirty: boolean
}

function EditTiersForm({ event, eventId }: EditTiersFormProps) {
  const [tiers, setTiers] = useState<TierEditState[]>(
    (event.ticketType ?? []).map(t => ({
      _id: t._id,
      name: t.name,
      price: (t.price ?? 0).toString(),
      capacity: (t.capacity ?? 0).toString(),
      dirty: false,
    }))
  )
  const [newTier, setNewTier] = useState({ name: '', price: '', capacity: '' })
  const [addingNew, setAddingNew] = useState(false)
  const [tierErrors, setTierErrors] = useState<Record<string, string>>({})
  const [addError, setAddError] = useState('')

  const updateTierMutation = useUpdateTier()
  const deleteTierMutation = useDeleteTier()
  const addTierMutation    = useAddTier()

  function updateTierField(
    id: string,
    field: keyof Omit<TierEditState, '_id' | 'dirty'>,
    value: string
  ) {
    setTiers(prev =>
      prev.map(t => t._id === id ? { ...t, [field]: value, dirty: true } : t)
    )
    setTierErrors(prev => ({ ...prev, [id]: '' }))
  }

  function handleSaveTier(tier: TierEditState) {
    const price    = Number(tier.price)
    const capacity = Number(tier.capacity)
    if (!tier.name.trim() || price < 0 || capacity <= 0) {
      setTierErrors(prev => ({
        ...prev,
        [tier._id]: 'Valid name, price ≥ 0, and capacity > 0 required.',
      }))
      return
    }
    updateTierMutation.mutate(
      { eventId, tierId: tier._id, data: { name: tier.name.trim(), price, capacity } },
      {
        onSuccess: () =>
          setTiers(prev => prev.map(t => t._id === tier._id ? { ...t, dirty: false } : t)),
        onError: () =>
          setTierErrors(prev => ({
            ...prev,
            [tier._id]: 'Failed to save. Please try again.',
          })),
      }
    )
  }

  function handleDeleteTier(tierId: string) {
    deleteTierMutation.mutate(
      { eventId, tierId },
      { onSuccess: () => setTiers(prev => prev.filter(t => t._id !== tierId)) }
    )
  }

  function handleAddTier() {
    const price    = Number(newTier.price)
    const capacity = Number(newTier.capacity)
    if (!newTier.name.trim() || price < 0 || capacity <= 0) {
      setAddError('Valid name, price ≥ 0, and capacity > 0 required.')
      return
    }
    setAddError('')
    addTierMutation.mutate(
      { eventId, data: { name: newTier.name.trim(), price, capacity } },
      {
        onSuccess: (data: unknown) => {
          const raw = data as { data?: { _id?: string } } | { _id?: string }
          const created = (raw as { data?: { _id?: string } }).data ?? raw as { _id?: string }
          setTiers(prev => [
            ...prev,
            {
              _id:      created._id ?? `temp-${Date.now()}`,
              name:     newTier.name.trim(),
              price:    newTier.price,
              capacity: newTier.capacity,
              dirty:    false,
            },
          ])
          setNewTier({ name: '', price: '', capacity: '' })
          setAddingNew(false)
        },
        onError: () => setAddError('Failed to add tier. Please try again.'),
      }
    )
  }

  return (
    <div className="space-y-4">
      {tiers.length === 0 && !addingNew && (
        <p className="text-sm text-zinc-500 text-center py-8">
          No tiers yet. Add one below.
        </p>
      )}

      {/* Existing tiers */}
      {tiers.map(tier => (
        <div
          key={tier._id}
          className="bg-zinc-800 border-2 border-(--color-border) rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Tier
            </span>
            <button
              type="button"
              onClick={() => handleDeleteTier(tier._id)}
              disabled={deleteTierMutation.isPending}
              aria-label={`Delete ${tier.name}`}
              className="text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-40 focus-visible:outline-none"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div>
            <label className={sheetLabel}>Tier Name</label>
            <input
              type="text"
              value={tier.name}
              onChange={e => updateTierField(tier._id, 'name', e.target.value)}
              className={sheetInput}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={sheetLabel}>Price (₦)</label>
              <input
                type="number"
                min="0"
                value={tier.price}
                onChange={e => updateTierField(tier._id, 'price', e.target.value)}
                className={sheetInput}
              />
            </div>
            <div>
              <label className={sheetLabel}>Capacity</label>
              <input
                type="number"
                min="1"
                value={tier.capacity}
                onChange={e => updateTierField(tier._id, 'capacity', e.target.value)}
                className={sheetInput}
              />
            </div>
          </div>

          {tierErrors[tier._id] && (
            <p className="text-xs text-red-500 font-medium">{tierErrors[tier._id]}</p>
          )}

          {tier.dirty ? (
            <button
              type="button"
              onClick={() => handleSaveTier(tier)}
              disabled={updateTierMutation.isPending}
              className="w-full py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {updateTierMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 size={12} />
              Saved
            </div>
          )}
        </div>
      ))}

      {/* New tier inline form */}
      {addingNew ? (
        <div className="bg-violet-950/40 border-2 border-violet-900/50 rounded-2xl p-4 space-y-3">
          <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
            New Tier
          </span>

          <div>
            <label className={sheetLabel}>Tier Name</label>
            <input
              type="text"
              value={newTier.name}
              onChange={e => setNewTier({ ...newTier, name: e.target.value })}
              placeholder="e.g. VIP, Regular, Table"
              className={sheetInput}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={sheetLabel}>Price (₦)</label>
              <input
                type="number"
                min="0"
                value={newTier.price}
                onChange={e => setNewTier({ ...newTier, price: e.target.value })}
                placeholder="0"
                className={sheetInput}
              />
            </div>
            <div>
              <label className={sheetLabel}>Capacity</label>
              <input
                type="number"
                min="1"
                value={newTier.capacity}
                onChange={e => setNewTier({ ...newTier, capacity: e.target.value })}
                placeholder="50"
                className={sheetInput}
              />
            </div>
          </div>

          {addError && (
            <p className="text-xs text-red-500 font-medium">{addError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setAddingNew(false)
                setAddError('')
                setNewTier({ name: '', price: '', capacity: '' })
              }}
              className="flex-1 py-2.5 border-2 border-violet-900/50 text-violet-400 text-sm font-bold rounded-xl hover:bg-violet-950/40 transition-colors focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddTier}
              disabled={addTierMutation.isPending}
              className="flex-1 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {addTierMutation.isPending ? 'Adding…' : 'Add Tier'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="w-full py-3.5 border-2 border-dashed border-zinc-700 hover:border-violet-400 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-zinc-400 hover:text-violet-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <Plus size={16} />
          Add New Tier
        </button>
      )}
    </div>
  )
}
