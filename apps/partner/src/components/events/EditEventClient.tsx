'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Button, ErrorMessage, Input, Modal } from '@comfytag/ui'
import { EVENT_CATEGORIES, NIGERIAN_STATES } from '@comfytag/utils'
import { LiveTicketPreview } from '@/components/events/wizard/LiveTicketPreview'
import { PerformerTag } from '@/components/events/PerformerTag'
import { TierListRow } from '@/components/events/TierListRow'
import { api } from '@/lib/api'
import { useEventById } from '@/hooks/useEvents'
import { partnerEventKeys } from '@/hooks/queryKeys'
import type { CreateEventFormData, TierInput } from '@/hooks/useCreateEventWizard'

// ── Styling — mirrors the Create wizard exactly ───────────────────────────────

const fieldLabel =
  'block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2'
const inputCls =
  'w-full bg-white border-2 border-zinc-200 focus:border-violet-500 rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none transition-colors'
const selectCls =
  'w-full appearance-none bg-white border-2 border-zinc-200 focus:border-violet-500 rounded-xl px-4 py-3.5 pr-10 text-sm text-zinc-900 focus:outline-none focus-visible:outline-none transition-colors cursor-pointer'

const VIBES = [
  { key: 'Hype',         label: '🔥 Hype' },
  { key: 'Professional', label: '👔 Professional' },
  { key: 'Exclusive',    label: '🍸 Exclusive' },
  { key: 'Casual',       label: '🎸 Casual' },
] as const

const AI_LIMIT = 3

// ── Small helpers ─────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function SelectChevron() {
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

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

interface ToastProps { message: string; onDismiss: () => void }
function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-zinc-900 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 max-w-xs"
    >
      <span className="text-red-400 shrink-0" aria-hidden="true">⚠</span>
      {message}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-1 text-zinc-400 hover:text-white transition-colors shrink-0 focus-visible:outline-none"
      >
        ✕
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface EditEventClientProps {
  eventId: string
}

export function EditEventClient({ eventId }: EditEventClientProps) {
  const router     = useRouter()
  const qc         = useQueryClient()
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const descPopoverRef = useRef<HTMLDivElement>(null)
  const seeded         = useRef(false)

  // ── Data fetching ───────────────────────────────────────────────────────────
  const { data: event, isLoading, isError } = useEventById(eventId)

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '', headline: '', category: '', secondaryCategory: '', date: '', startTime: '', endTime: '',
    venue: '', address: '', state: '', description: '',
  })
  const [images,       setImages]       = useState<string[]>([])
  const [tiers,        setTiers]        = useState<TierInput[]>([])
  const [performers,   setPerformers]   = useState<string[]>([])
  const [specialNotes, setSpecialNotes] = useState('')
  const [isPublic,     setIsPublic]     = useState(true)
  const [performerInput, setPerformerInput] = useState('')

  // ── UI state ────────────────────────────────────────────────────────────────
  const [uploading,       setUploading]       = useState(false)
  const [error,           setError]           = useState('')
  const [tierModal,       setTierModal]       = useState(false)
  const [currentTier,     setCurrentTier]     = useState<TierInput>({ name: '', price: '', capacity: '' })
  const [editingTierIdx,  setEditingTierIdx]  = useState<number | null>(null)
  const [tierError,       setTierError]       = useState('')
  const [aiUsesLeft,      setAiUsesLeft]      = useState(AI_LIMIT)
  const [isGenerating,    setIsGenerating]    = useState(false)
  const [isVibeOpen,      setIsVibeOpen]      = useState(false)
  const [toastMessage,    setToastMessage]    = useState<string | null>(null)

  // ── Seed form once on first data load ───────────────────────────────────────
  useEffect(() => {
    if (!event || seeded.current) return
    seeded.current = true

    setForm({
      name:              event.name ?? '',
      headline:          event.headline ?? '',
      category:          event.category ?? '',
      secondaryCategory: event.secondaryCategory ?? '',
      date:              event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      startTime:         event.startTime ?? '',
      endTime:           event.endTime ?? '',
      venue:             event.venue ?? '',
      address:           event.address ?? '',
      state:             event.state ?? '',
      description:       event.description ?? '',
    })
    setImages(
      (event.images ?? []).length > 0
        ? event.images!
        : event.coverImage ? [event.coverImage] : []
    )
    setTiers(
      (event.ticketType ?? []).map(t => ({
        name:     t.name,
        price:    t.price.toString(),
        capacity: t.capacity.toString(),
      }))
    )
    setPerformers(
      event.performers?.map(p => (typeof p === 'string' ? p : p.name)) ?? []
    )
    setSpecialNotes(event.gateRules?.[0] ?? '')
  }, [event])

  // ── Reactive preview data ────────────────────────────────────────────────────
  const previewData: CreateEventFormData = {
    name:              form.name,
    headline:          form.headline,
    category:          form.category,
    secondaryCategory: form.secondaryCategory,
    date:              form.date,
    startTime:   form.startTime,
    endTime:     form.endTime,
    venue:       form.venue,
    address:     form.address,
    state:       form.state,
    images,
    tiers,
    description: form.description,
    performers,
    details:     { specialNotes, isPublic },
  }

  // ── PATCH mutation ───────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch(`/events/${eventId}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: partnerEventKeys.detail(eventId) })
      qc.invalidateQueries({ queryKey: partnerEventKeys.list() })
      router.push(`/events/${eventId}`)
    },
    onError: () => setError('Failed to save changes. Please try again.'),
  })

  // ── Image upload ─────────────────────────────────────────────────────────────
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
      setError('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Tier management ───────────────────────────────────────────────────────────
  function openAddTierModal() {
    setCurrentTier({ name: '', price: '', capacity: '' })
    setEditingTierIdx(null)
    setTierError('')
    setTierModal(true)
  }

  function openEditTierModal(index: number) {
    setCurrentTier(tiers[index])
    setEditingTierIdx(index)
    setTierError('')
    setTierModal(true)
  }

  function handleSaveTier() {
    const price    = Number(currentTier.price)
    const capacity = Number(currentTier.capacity)
    if (!currentTier.name.trim() || price < 0 || capacity <= 0) {
      setTierError('Valid name, price ≥ 0, and capacity > 0 required.')
      return
    }
    if (editingTierIdx !== null) {
      setTiers(prev => {
        const next = [...prev]
        next[editingTierIdx] = currentTier
        return next
      })
    } else {
      setTiers(prev => [...prev, currentTier])
    }
    setTierModal(false)
    setTierError('')
  }

  // ── AI enhance ────────────────────────────────────────────────────────────────
  const handleVibeSelect = useCallback(
    async (vibe: string) => {
      setIsVibeOpen(false)
      setIsGenerating(true)
      try {
        const res = await fetch('/api/ai/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.name,
            draftDescription: form.description || undefined,
            vibe,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { description?: string; error?: string }
        if (!data.description) throw new Error(data.error ?? 'Empty response')
        setForm(prev => ({ ...prev, description: data.description! }))
        setAiUsesLeft(prev => Math.max(0, prev - 1))
      } catch {
        setToastMessage('Failed to generate description. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    },
    [form.name, form.description],
  )

  useEffect(() => {
    if (!isVibeOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (descPopoverRef.current && !descPopoverRef.current.contains(e.target as Node)) {
        setIsVibeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVibeOpen])

  // ── Submit ────────────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!form.name.trim())        { setError('Event name is required'); return }
    if (!form.description.trim()) { setError('Description is required'); return }
    if (tiers.length === 0)       { setError('Add at least one ticket tier'); return }
    setError('')
    mutation.mutate({
      name:              form.name,
      headline:          form.headline || undefined,
      category:          form.category,
      secondaryCategory: form.secondaryCategory || undefined,
      description:       form.description,
      date:        form.date,
      startTime:   form.startTime,
      endTime:     form.endTime,
      venue:       form.venue,
      address:     form.address,
      state:       form.state,
      coverImage:  images[0] ?? '',
      images,
      ticketType: tiers.map(t => ({
        name:     t.name,
        price:    Number(t.price),
        capacity: Number(t.capacity),
      })),
      performers: performers.length > 0 ? performers : undefined,
      gateRules:  specialNotes.trim() ? [specialNotes.trim()] : undefined,
    })
  }

  // ── Loading / error guards ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-red-500 font-medium">Failed to load event. Please try again.</p>
        <Link href="/events" className="text-sm text-violet-600 hover:underline">
          Back to Events
        </Link>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">

        {/* Page header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/events/${eventId}`}
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
          >
            <BackArrowIcon />
            Event
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Edit Event</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Update your event details</p>
          </div>
        </div>

        {/* Split-screen — mirrors Create wizard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ── Left: form sections (7 cols) ─────────────────────────── */}
          <div className="lg:col-span-7 space-y-4">

            {/* ── 1 · Basic Info ────────────────────────────────────── */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Basic Info</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Name, category, date, and location</p>
              </div>

              {/* Event name */}
              <div>
                <label htmlFor="edit-name" className={fieldLabel}>
                  Event Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Summer Festival 2025"
                  className={inputCls}
                  autoFocus
                />
              </div>

              {/* Category + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-category" className={fieldLabel}>Category</label>
                  <div className="relative">
                    <select
                      id="edit-category"
                      value={form.category}
                      onChange={e => {
                        const next = e.target.value
                        setForm(prev => ({
                          ...prev,
                          category: next,
                          secondaryCategory: prev.secondaryCategory === next ? '' : prev.secondaryCategory,
                        }))
                      }}
                      className={selectCls}
                    >
                      <option value="">Select category</option>
                      {EVENT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-date" className={fieldLabel}>
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="edit-date"
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Second Vibe */}
              <div>
                <label htmlFor="edit-secondary-category" className={fieldLabel}>
                  Second Vibe{' '}
                  <span className="font-normal normal-case text-zinc-400 tracking-normal">(optional)</span>
                </label>
                <div className="relative">
                  <select
                    id="edit-secondary-category"
                    value={form.secondaryCategory}
                    onChange={e => setForm({ ...form, secondaryCategory: e.target.value })}
                    disabled={!form.category}
                    className={`${selectCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <option value="">None</option>
                    {EVENT_CATEGORIES.filter(cat => cat !== form.category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
                {!form.category && (
                  <p className="text-[11px] text-zinc-400 mt-1.5">Select a primary category first</p>
                )}
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-start" className={fieldLabel}>Start Time</label>
                  <input
                    id="edit-start"
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="edit-end" className={fieldLabel}>End Time</label>
                  <input
                    id="edit-end"
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label htmlFor="edit-venue" className={fieldLabel}>Venue</label>
                <input
                  id="edit-venue"
                  type="text"
                  value={form.venue}
                  onChange={e => setForm({ ...form, venue: e.target.value })}
                  placeholder="e.g. Lekki Conservancy"
                  className={inputCls}
                />
              </div>

              {/* Address + State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-address" className={fieldLabel}>Address</label>
                  <input
                    id="edit-address"
                    type="text"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="edit-state" className={fieldLabel}>State</label>
                  <div className="relative">
                    <select
                      id="edit-state"
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      className={selectCls}
                    >
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2 · Images ────────────────────────────────────────── */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Event Images</h2>
                <p className="text-sm text-zinc-500 mt-0.5">
                  First image is your cover. Up to 10 images (16:9 recommended).
                </p>
              </div>

              {/* Thumbnail strip */}
              {images.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {images.map((url, i) => (
                    <div key={url} className="relative shrink-0 group">
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 z-10 bg-violet-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider pointer-events-none">
                          Cover
                        </span>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Event image ${i + 1}`}
                        className="w-28 h-20 object-cover rounded-xl border-2 border-zinc-200 group-hover:border-violet-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter(u => u !== url))}
                        aria-label="Remove image"
                        className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none"
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload zone */}
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
                className="w-full border-2 border-dashed border-zinc-300 hover:border-violet-400 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {uploading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-semibold text-violet-600">Uploading…</span>
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-sm font-semibold text-zinc-700">
                      {images.length === 0 ? 'Upload images' : 'Add more images'}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {images.length}/10 · JPG, PNG, WEBP
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* ── 3 · Ticket Tiers ──────────────────────────────────── */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-zinc-900">Ticket Tiers</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">Set prices, names, and capacities</p>
                </div>
                <button
                  type="button"
                  onClick={openAddTierModal}
                  className="flex items-center gap-1.5 text-sm font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-4 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <Plus size={14} aria-hidden="true" />
                  Add Tier
                </button>
              </div>

              {tiers.length === 0 ? (
                <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                    <Plus size={18} className="text-zinc-400" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-500">No tiers yet</p>
                  <p className="text-xs text-zinc-400 mt-1">Add at least one ticket tier</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tiers.map((tier, i) => (
                    <TierListRow
                      key={i}
                      name={tier.name}
                      price={tier.price}
                      capacity={tier.capacity}
                      onEdit={() => openEditTierModal(i)}
                      onRemove={() => setTiers(prev => prev.filter((_, j) => j !== i))}
                    />
                  ))}
                </div>
              )}

              {tiers.length > 0 && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-700">
                    {tiers.length} tier{tiers.length > 1 ? 's' : ''} configured
                  </span>
                  <span className="text-xs text-violet-500">
                    Total capacity:{' '}
                    <span className="font-bold">
                      {tiers.reduce((s, t) => s + Number(t.capacity), 0).toLocaleString()}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* ── 4 · Description & Details ─────────────────────────── */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Details</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Description, lineup, and visibility</p>
              </div>

              {/* Description + ✨ Enhance */}
              <div>
                <label htmlFor="edit-description" className={fieldLabel}>
                  Description <span className="text-red-400">*</span>
                </label>

                <div ref={descPopoverRef} className="relative">
                  {/* Vibe popover */}
                  {isVibeOpen && (
                    <div
                      role="dialog"
                      aria-label="Choose a vibe for AI enhancement"
                      className="absolute bottom-full right-0 mb-2.5 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl shadow-zinc-900/10 p-4 z-50"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-xs font-black text-zinc-900">Choose a vibe</p>
                        <span
                          className={`text-[10px] font-bold tabular-nums whitespace-nowrap ${
                            aiUsesLeft > 0 ? 'text-violet-600' : 'text-zinc-400'
                          }`}
                        >
                          {aiUsesLeft > 0 ? `✨ ${aiUsesLeft} uses remaining` : 'Limit reached'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mb-3">
                        AI will rewrite your description in the chosen tone.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {VIBES.map(vibe => (
                          <button
                            key={vibe.key}
                            type="button"
                            onClick={() => handleVibeSelect(vibe.key)}
                            disabled={aiUsesLeft === 0}
                            className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-50 hover:bg-violet-50 border border-zinc-200 hover:border-violet-300 rounded-xl text-xs font-semibold text-zinc-700 hover:text-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          >
                            {vibe.label}
                          </button>
                        ))}
                      </div>
                      {/* Popover arrow */}
                      <div className="absolute bottom-0 right-6 translate-y-full">
                        <div className="w-3 h-1.5 overflow-hidden">
                          <div className="w-3 h-3 bg-white border border-zinc-200 rotate-45 -translate-y-1.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  <textarea
                    id="edit-description"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Tell attendees what makes this event special..."
                    rows={5}
                    disabled={isGenerating}
                    className={[
                      inputCls,
                      'resize-none pb-10',
                      isGenerating ? 'opacity-50 animate-pulse cursor-not-allowed' : '',
                    ].filter(Boolean).join(' ')}
                  />

                  <button
                    type="button"
                    onClick={() => setIsVibeOpen(prev => !prev)}
                    disabled={isGenerating}
                    aria-expanded={isVibeOpen}
                    aria-haspopup="dialog"
                    className={[
                      'absolute bottom-3 right-3 flex items-center gap-1.5',
                      'bg-zinc-900 text-white rounded-full text-xs font-bold px-3 py-1.5',
                      'shadow-lg ring-1 ring-violet-500/30 transition-all duration-200',
                      'hover:shadow-violet-500/20 hover:ring-violet-500/60 hover:bg-zinc-800',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      isVibeOpen ? 'ring-violet-500/60' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {isGenerating ? (
                      <>
                        <SpinnerIcon />
                        Generating…
                      </>
                    ) : '✨ Enhance'}
                  </button>
                </div>

                {aiUsesLeft === 0 && (
                  <p className="mt-1.5 text-[11px] text-zinc-400 font-medium">
                    AI enhancement limit reached for this session.
                  </p>
                )}
              </div>

              {/* Performers / Lineup */}
              <div>
                <label htmlFor="edit-performer" className={fieldLabel}>
                  Performers / Lineup{' '}
                  <span className="text-zinc-400 font-medium normal-case tracking-normal">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="edit-performer"
                    type="text"
                    value={performerInput}
                    onChange={e => setPerformerInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const name = performerInput.trim()
                        if (name) { setPerformers(p => [...p, name]); setPerformerInput('') }
                      }
                    }}
                    placeholder="Add performer and press Enter"
                    className="flex-1 bg-white border-2 border-zinc-200 focus:border-violet-500 rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const name = performerInput.trim()
                      if (name) { setPerformers(p => [...p, name]); setPerformerInput('') }
                    }}
                    aria-label="Add performer"
                    className="w-12 h-12 flex items-center justify-center bg-violet-50 border-2 border-violet-200 hover:bg-violet-100 rounded-xl text-violet-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0 mt-0.5"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
                {performers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {performers.map((performer, idx) => (
                      <PerformerTag
                        key={idx}
                        name={performer}
                        onRemove={() => setPerformers(p => p.filter((_, i) => i !== idx))}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Special Notes */}
              <div>
                <label htmlFor="edit-notes" className={fieldLabel}>
                  Special Notes / Requirements{' '}
                  <span className="text-zinc-400 font-medium normal-case tracking-normal">(Optional)</span>
                </label>
                <textarea
                  id="edit-notes"
                  value={specialNotes}
                  onChange={e => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Age restrictions, dress code, items not allowed..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Visibility toggle */}
              <div>
                <p className={fieldLabel}>Visibility</p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={e => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                      id="edit-is-public"
                    />
                    <div className="w-10 h-6 bg-zinc-200 peer-checked:bg-violet-600 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500 peer-focus-visible:ring-offset-2" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {isPublic ? 'Public' : 'Private'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {isPublic
                        ? 'Visible to all attendees on ComfyTag'
                        : 'Only accessible via direct link'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* ── Error + CTA ────────────────────────────────────────── */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pb-8">
              <Link
                href={`/events/${eventId}`}
                className="flex-1 text-center py-4 border-2 border-zinc-200 text-zinc-700 text-sm font-bold rounded-2xl hover:bg-zinc-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="flex-1 bg-violet-600 text-white text-sm font-bold py-4 rounded-2xl hover:bg-violet-700 active:bg-violet-800 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {mutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* ── Right: sticky live preview (5 cols) ─────────────────── */}
          <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-8">
            <LiveTicketPreview formData={previewData} />
          </div>
        </div>
      </div>

      {/* ── Tier modal (reuses Step3 pattern) ────────────────────────── */}
      <Modal
        isOpen={tierModal}
        onClose={() => setTierModal(false)}
        title={editingTierIdx !== null ? 'Edit Ticket Tier' : 'Add Ticket Tier'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTierModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTier}>
              {editingTierIdx !== null ? 'Update Tier' : 'Add Tier'}
            </Button>
          </>
        }
      >
        <Input
          label="Tier Name"
          placeholder="e.g. Regular, VIP, VVIP"
          value={currentTier.name}
          onChange={e => setCurrentTier({ ...currentTier, name: e.target.value })}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <Input
            label="Price (₦)"
            type="number"
            placeholder="0"
            value={currentTier.price}
            onChange={e => setCurrentTier({ ...currentTier, price: e.target.value })}
          />
          <Input
            label="Capacity"
            type="number"
            placeholder="0"
            value={currentTier.capacity}
            onChange={e => setCurrentTier({ ...currentTier, capacity: e.target.value })}
          />
        </div>
        {tierError && (
          <div style={{ marginTop: '12px' }}>
            <ErrorMessage message={tierError} />
          </div>
        )}
      </Modal>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </>
  )
}
