'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { NIGERIAN_STATES, EVENT_CATEGORIES } from '@comfytag/utils'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface Step1BasicInfoProps {
  formData: CreateEventFormData
  updateField: (field: keyof CreateEventFormData, value: unknown) => void
  stepErrors: string
  onNext: () => void
  onPrev: () => void
}

const label = 'block text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-2'
const input =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:bg-white focus:border-violet-500 transition-all placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none'
const select =
  'w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 pr-10 text-zinc-900 text-sm focus:bg-white focus:border-violet-500 transition-all focus:outline-none focus-visible:outline-none cursor-pointer'

const VIBES = [
  { key: 'Hype',         label: '🔥 Hype' },
  { key: 'Professional', label: '👔 Professional' },
  { key: 'Exclusive',    label: '🍸 Exclusive' },
  { key: 'Casual',       label: '🎸 Casual' },
] as const

const AI_LIMIT = 3

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

export function Step1BasicInfo({
  formData,
  updateField,
  stepErrors,
  onNext,
}: Step1BasicInfoProps) {
  const headlinePopoverRef = useRef<HTMLDivElement>(null)
  const [isVibeOpen,   setIsVibeOpen]   = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiUsesLeft,   setAiUsesLeft]   = useState(AI_LIMIT)
  const [toastMsg,     setToastMsg]     = useState<string | null>(null)

  useEffect(() => {
    if (!isVibeOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (headlinePopoverRef.current && !headlinePopoverRef.current.contains(e.target as Node)) {
        setIsVibeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVibeOpen])

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 4000)
    return () => clearTimeout(t)
  }, [toastMsg])

  const handleVibeSelect = useCallback(
    async (vibe: string) => {
      setIsVibeOpen(false)
      setIsGenerating(true)
      try {
        const res = await fetch('/api/ai/generate-headline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.name,
            category: formData.category || undefined,
            draftHeadline: formData.headline || undefined,
            vibe,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { headline?: string; error?: string }
        if (!data.headline) throw new Error(data.error ?? 'Empty response')
        updateField('headline', data.headline)
        setAiUsesLeft(prev => Math.max(0, prev - 1))
      } catch {
        setToastMsg('Failed to generate headline. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    },
    [formData.name, formData.category, formData.headline, updateField],
  )

  return (
    <>
    <div className="max-w-3xl mx-auto bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl sm:rounded-[2.5rem] p-6 sm:p-10 mt-8 animate-in fade-in duration-300 space-y-6">
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-violet-600 font-bold mb-4 block">Step 1 of 5</span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-2">Basic Info</h2>
        <p className="text-sm text-zinc-500 mb-8">Name, category, date, and location</p>
      </div>

      {/* Event name */}
      <div>
        <label htmlFor="event-name" className={label}>
          Event Name <span className="text-red-400">*</span>
        </label>
        <input
          id="event-name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g. Summer Festival 2025"
          className={input}
          autoFocus
        />
      </div>

      {/* Headline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="event-headline" className={label} style={{ marginBottom: 0 }}>
            Headline <span className="text-zinc-400 font-normal normal-case">(optional)</span>
          </label>
          <div className="relative" ref={headlinePopoverRef}>
            <button
              type="button"
              onClick={() => setIsVibeOpen(prev => !prev)}
              disabled={isGenerating || aiUsesLeft === 0}
              aria-expanded={isVibeOpen}
              aria-haspopup="dialog"
              className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full hover:bg-violet-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {isGenerating ? '…' : '✨ Enhance'}
            </button>
            {isVibeOpen && (
              <div
                role="dialog"
                aria-label="Choose a vibe for AI headline"
                className="absolute top-full right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl shadow-zinc-900/10 p-4 z-50"
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
                  AI will write a punchy 1-line hook for your event.
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
                <div className="absolute top-0 right-6 -translate-y-full rotate-180">
                  <div className="w-3 h-1.5 overflow-hidden">
                    <div className="w-3 h-3 bg-white border border-zinc-200 rotate-45 -translate-y-1.5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <input
          id="event-headline"
          type="text"
          value={formData.headline}
          onChange={(e) => updateField('headline', e.target.value)}
          placeholder="e.g. Lagos's biggest music festival is back"
          maxLength={150}
          disabled={isGenerating}
          className={[input, isGenerating ? 'opacity-50 animate-pulse cursor-not-allowed' : ''].filter(Boolean).join(' ')}
        />
        <p className="text-[11px] text-zinc-400 mt-1.5 text-right tabular-nums">
          {formData.headline.length}/150
        </p>
      </div>

      {/* Category + Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-category" className={label}>
            Category
          </label>
          <div className="relative">
            <select
              id="event-category"
              value={formData.category}
              onChange={(e) => {
                updateField('category', e.target.value)
                if (e.target.value === formData.secondaryCategory) {
                  updateField('secondaryCategory', '')
                }
              }}
              className={select}
            >
              <option value="">Select category</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        <div>
          <label htmlFor="event-date" className={label}>
            Date <span className="text-red-400">*</span>
          </label>
          <input
            id="event-date"
            type="date"
            value={formData.date}
            onChange={(e) => updateField('date', e.target.value)}
            className={input}
          />
        </div>
      </div>

      {/* Second Vibe */}
      <div>
        <label htmlFor="event-secondary-category" className={label}>
          Second Vibe{' '}
          <span className="font-normal normal-case text-zinc-400 tracking-normal">(optional)</span>
        </label>
        <div className="relative">
          <select
            id="event-secondary-category"
            value={formData.secondaryCategory}
            onChange={(e) => updateField('secondaryCategory', e.target.value)}
            disabled={!formData.category}
            className={`${select} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <option value="">None</option>
            {EVENT_CATEGORIES.filter((cat) => cat !== formData.category).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>
        {!formData.category && (
          <p className="text-[11px] text-zinc-400 mt-1.5">Select a primary category first</p>
        )}
      </div>

      {/* Start + End time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-start-time" className={label}>
            Start Time <span className="text-red-400">*</span>
          </label>
          <input
            id="event-start-time"
            type="time"
            value={formData.startTime}
            onChange={(e) => updateField('startTime', e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="event-end-time" className={label}>
            End Time
          </label>
          <input
            id="event-end-time"
            type="time"
            value={formData.endTime}
            onChange={(e) => updateField('endTime', e.target.value)}
            className={input}
          />
        </div>
      </div>

      {/* Venue name */}
      <div>
        <label htmlFor="event-venue" className={label}>
          Venue Name
        </label>
        <input
          id="event-venue"
          type="text"
          value={formData.venue}
          onChange={(e) => updateField('venue', e.target.value)}
          placeholder="e.g. Lekki Conservancy"
          className={input}
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="event-address" className={label}>
          Address
        </label>
        <input
          id="event-address"
          type="text"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="e.g. Plot 50, Admiralty Way, Lekki"
          className={input}
        />
      </div>

      {/* State */}
      <div>
        <label htmlFor="event-state" className={label}>
          State
        </label>
        <div className="relative">
          <select
            id="event-state"
            value={formData.state}
            onChange={(e) => updateField('state', e.target.value)}
            className={select}
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>

      {/* Error */}
      {stepErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600 font-medium">{stepErrors}</p>
        </div>
      )}

    </div>

    {/* Sticky nav bar */}
    <div
      className="fixed bottom-0 max-md:bottom-24 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-zinc-200/80 p-4 z-50 shadow-[0_-4px_20px_rgb(0,0,0,0.05)]"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="bg-white border border-zinc-200 text-zinc-300 font-bold py-3 px-8 rounded-full cursor-not-allowed text-sm"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="bg-zinc-900 text-white font-bold py-3 px-8 rounded-full shadow-sm active:scale-95 transition-all text-sm"
        >
          Next: Cover Image →
        </button>
      </div>
    </div>

    {/* Toast */}
    {toastMsg && (
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-100 bg-zinc-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
        {toastMsg}
      </div>
    )}
    </>
  )
}
