'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { PerformerTag } from '@/components/events/PerformerTag'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface Step4DetailsProps {
  formData: CreateEventFormData
  updateField: (field: keyof CreateEventFormData, value: unknown) => void
  handleAddPerformer: () => void
  handleRemovePerformer: (index: number) => void
  performerInput: string
  setPerformerInput: (val: string) => void
  stepErrors: string
  onNext: () => void
  onPrev: () => void
}

const VIBES = [
  { key: 'Hype', label: '🔥 Hype' },
  { key: 'Professional', label: '👔 Professional' },
  { key: 'Exclusive', label: '🍸 Exclusive' },
  { key: 'Casual', label: '🎸 Casual' },
] as const

const AI_LIMIT = 3

const fieldLabel = 'block text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-2'
const inputCls =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:bg-white focus:border-violet-500 transition-all placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none resize-none'

// ── Sub-components ─────────────────────────────────────────────────────────────

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

interface ToastProps {
  message: string
  onDismiss: () => void
}

function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-100 flex items-center gap-3 bg-zinc-900 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 animate-in fade-in slide-in-from-bottom-2 max-w-xs"
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

// ── Main component ─────────────────────────────────────────────────────────────

export function Step4Details({
  formData,
  updateField,
  handleAddPerformer,
  handleRemovePerformer,
  performerInput,
  setPerformerInput,
  stepErrors,
  onNext,
  onPrev,
}: Step4DetailsProps) {
  const [aiUsesLeft, setAiUsesLeft] = useState(AI_LIMIT)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isVibeOpen, setIsVibeOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const popoverContainerRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside the textarea + button container
  useEffect(() => {
    if (!isVibeOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverContainerRef.current &&
        !popoverContainerRef.current.contains(e.target as Node)
      ) {
        setIsVibeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVibeOpen])

  const dismissToast = useCallback(() => setToastMessage(null), [])

  const handleVibeSelect = useCallback(
    async (vibe: string) => {
      setIsVibeOpen(false)
      setIsGenerating(true)

      try {
        const res = await fetch('/api/ai/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.name,
            draftDescription: formData.description || undefined,
            vibe,
          }),
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const data = (await res.json()) as { description?: string; error?: string }
        if (!data.description) throw new Error(data.error ?? 'Empty response')

        updateField('description', data.description)
        setAiUsesLeft((prev) => Math.max(0, prev - 1))
      } catch {
        setToastMessage('Failed to generate description. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    },
    [formData.name, formData.description, updateField],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddPerformer()
    }
  }

  return (
    <>
      <div className="max-w-3xl mx-auto bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl sm:rounded-[2.5rem] p-6 sm:p-10 mt-8 animate-in fade-in duration-300 space-y-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-violet-600 font-bold mb-4 block">Step 4 of 5</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-2">Event Details</h2>
          <p className="text-sm text-zinc-500 mb-8">Description, lineup, and visibility</p>
        </div>

        {/* Description + AI Enhance */}
        <div>
          <label htmlFor="event-description" className={fieldLabel}>
            Description <span className="text-red-400">*</span>
          </label>

          {/* Relative container holds textarea + absolute button + popover */}
          <div ref={popoverContainerRef} className="relative">

            {/* Vibe popover — above the Enhance button */}
            {isVibeOpen && (
              <div
                role="dialog"
                aria-label="Choose a vibe for AI enhancement"
                className="absolute bottom-full right-0 mb-2.5 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl shadow-zinc-900/10 p-4 z-50"
              >
                {/* Popover header */}
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-bold text-zinc-900">Choose a vibe</p>
                  <span
                    className={`text-[10px] font-bold tabular-nums whitespace-nowrap ${
                      aiUsesLeft > 0 ? 'text-violet-600' : 'text-zinc-400'
                    }`}
                  >
                    {aiUsesLeft > 0 ? `✨ ${aiUsesLeft} uses remaining` : 'Limit reached for this event.'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mb-3">
                  AI will rewrite your description in the chosen tone.
                </p>

                {/* Vibe grid */}
                <div className="grid grid-cols-2 gap-2">
                  {VIBES.map((vibe) => (
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

                {/* Arrow pointing down at the button */}
                <div className="absolute bottom-0 right-6 translate-y-full">
                  <div className="w-3 h-1.5 overflow-hidden">
                    <div className="w-3 h-3 bg-white border border-zinc-200 rotate-45 -translate-y-1.5" />
                  </div>
                </div>
              </div>
            )}

            {/* Textarea */}
            <textarea
              id="event-description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Tell attendees what makes this event special..."
              rows={5}
              disabled={isGenerating}
              className={[
                inputCls,
                'pb-10', // room for the Enhance button
                isGenerating ? 'opacity-50 animate-pulse cursor-not-allowed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />

            {/* ✨ Enhance button */}
            <button
              type="button"
              onClick={() => setIsVibeOpen((prev) => !prev)}
              disabled={isGenerating}
              aria-expanded={isVibeOpen}
              aria-haspopup="dialog"
              className={[
                'absolute bottom-3 right-3 flex items-center gap-1.5',
                'bg-zinc-900 text-white rounded-full text-xs font-bold px-3 py-1.5',
                'shadow-lg ring-1 ring-violet-500/30',
                'transition-all duration-200',
                'hover:shadow-violet-500/20 hover:ring-violet-500/60 hover:bg-zinc-800',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isVibeOpen ? 'ring-violet-500/60 shadow-violet-500/20' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {isGenerating ? (
                <>
                  <SpinnerIcon />
                  Generating…
                </>
              ) : (
                '✨ Enhance'
              )}
            </button>
          </div>

          {/* Uses exhausted hint below textarea */}
          {aiUsesLeft === 0 && (
            <p className="mt-1.5 text-[11px] text-zinc-400 font-medium">
              AI enhancement limit reached for this session.
            </p>
          )}
        </div>

        {/* Performers / Lineup */}
        <div>
          <label htmlFor="performer-input" className={fieldLabel}>
            Performers / Lineup{' '}
            <span className="text-zinc-400 font-medium normal-case tracking-normal">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="performer-input"
              type="text"
              value={performerInput}
              onChange={(e) => setPerformerInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add performer and press Enter"
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:bg-white focus:border-violet-500 transition-all placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={handleAddPerformer}
              aria-label="Add performer"
              className="w-12 h-12 flex items-center justify-center bg-violet-50 border border-violet-200 hover:bg-violet-100 rounded-full text-violet-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0 mt-0.5"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>

          {formData.performers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.performers.map((performer, idx) => (
                <PerformerTag
                  key={idx}
                  name={performer}
                  onRemove={() => handleRemovePerformer(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Special Notes */}
        <div>
          <label htmlFor="event-notes" className={fieldLabel}>
            Special Notes / Requirements{' '}
            <span className="text-zinc-400 font-medium normal-case tracking-normal">(Optional)</span>
          </label>
          <textarea
            id="event-notes"
            value={formData.details.specialNotes}
            onChange={(e) =>
              updateField('details', {
                ...formData.details,
                specialNotes: e.target.value,
              })
            }
            placeholder="e.g. Age restrictions, dress code, items not allowed..."
            rows={3}
            className={inputCls}
          />
        </div>

        {/* Visibility toggle */}
        <div>
          <p className={fieldLabel}>Visibility</p>
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={formData.details.isPublic}
                onChange={(e) =>
                  updateField('details', {
                    ...formData.details,
                    isPublic: e.target.checked,
                  })
                }
                className="sr-only peer"
                id="is-public"
              />
              <div className="w-10 h-6 bg-zinc-200 peer-checked:bg-violet-600 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500 peer-focus-visible:ring-offset-2" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {formData.details.isPublic ? 'Public' : 'Private'}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {formData.details.isPublic
                  ? 'Visible to all attendees on ComfyTag'
                  : 'Only accessible via direct link'}
              </p>
            </div>
          </label>
        </div>

        {/* Form validation error */}
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
            onClick={onPrev}
            className="bg-white border border-zinc-200 text-zinc-700 font-bold py-3 px-8 rounded-full hover:bg-zinc-50 active:scale-95 transition-all text-sm"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="bg-zinc-900 text-white font-bold py-3 px-8 rounded-full shadow-sm active:scale-95 transition-all text-sm"
          >
            Review & Launch →
          </button>
        </div>
      </div>

      {/* Toast — portalled to viewport bottom-right */}
      {toastMessage && <Toast message={toastMessage} onDismiss={dismissToast} />}
    </>
  )
}
