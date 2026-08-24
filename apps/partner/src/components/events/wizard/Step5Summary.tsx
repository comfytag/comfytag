'use client'

import React from 'react'
import { formatDate, formatTime, formatNaira } from '@comfytag/utils'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface SummaryCardProps {
  title: string
  onEdit: () => void
  children: React.ReactNode
}

function SummaryCard({ title, onEdit, children }: SummaryCardProps) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">{title}</p>
        <button
          type="button"
          onClick={onEdit}
          className="text-violet-400 text-xs font-bold hover:text-violet-300 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  )
}

interface Step5SummaryProps {
  formData: CreateEventFormData
  stepErrors: string
  onGoToStep: (step: 1 | 2 | 3 | 4 | 5) => void
  onSubmit: (status: 'draft' | 'published') => void
  isPending: boolean
  onPrev: () => void
}

export function Step5Summary({
  formData,
  stepErrors,
  onGoToStep,
  onSubmit,
  isPending,
  onPrev,
}: Step5SummaryProps) {
  const dateLabel =
    formData.date && formData.startTime
      ? `${formatDate(formData.date)} at ${formatTime(formData.startTime)}`
      : formData.date
        ? formatDate(formData.date)
        : '—'

  const locationLabel = [formData.venue, formData.address, formData.state]
    .filter(Boolean)
    .join(', ') || '—'

  return (
    <>
    <div className="max-w-3xl mx-auto space-y-5 mt-8 animate-in fade-in duration-300">
      {/* Celebratory launch header */}
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🚀</div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400 font-bold mb-4 block">Step 5 of 5</span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-(--color-text) mb-2">Ready for launch?</h2>
        <p className="text-sm text-(--color-text-muted) mb-8 max-w-xs mx-auto">
          Review your event details below. You can always edit before publishing.
        </p>
      </div>

      {/* Summary sections */}
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-6 space-y-3">
        <SummaryCard title="Event Info" onEdit={() => onGoToStep(1)}>
          <p className="text-sm font-bold text-(--color-text) leading-tight">{formData.name || '—'}</p>
          <p className="text-xs text-zinc-400 mt-1">{dateLabel}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{locationLabel}</p>
          {formData.category && (
            <span className="inline-block mt-2 text-[10px] font-bold bg-violet-950/40 text-violet-400 px-2 py-0.5 rounded-full">
              {formData.category}
            </span>
          )}
        </SummaryCard>

        <SummaryCard title={`Images (${formData.images.length})`} onEdit={() => onGoToStep(2)}>
          {formData.images.length > 0 ? (
            <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
              {formData.images.slice(0, 4).map((url, i) => (
                <div key={url} className="relative shrink-0">
                  {i === 0 && (
                    <span className="absolute top-1 left-1 z-10 bg-violet-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-full uppercase pointer-events-none">
                      Cover
                    </span>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Image ${i + 1}`}
                    className="w-16 h-11 object-cover rounded-lg border border-zinc-700"
                  />
                </div>
              ))}
              {formData.images.length > 4 && (
                <div className="w-16 h-11 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-zinc-500">
                    +{formData.images.length - 4}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No images uploaded</p>
          )}
        </SummaryCard>

        <SummaryCard title={`Ticket Tiers (${formData.tiers.length})`} onEdit={() => onGoToStep(3)}>
          {formData.tiers.length > 0 ? (
            <div className="space-y-1 mt-1">
              {formData.tiers.map((tier, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-zinc-300">{tier.name}</span>
                  <span className="text-zinc-500 text-xs">
                    {Number(tier.price) === 0 ? 'Free' : formatNaira(Number(tier.price))} · {Number(tier.capacity).toLocaleString()} cap
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-500 font-medium">No tiers added — required</p>
          )}
        </SummaryCard>

        <SummaryCard title="Description & Details" onEdit={() => onGoToStep(4)}>
          <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
            {formData.description || <span className="text-zinc-500">No description added</span>}
          </p>
          {formData.performers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formData.performers.map((p, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold bg-violet-950/40 text-violet-400 px-2 py-0.5 rounded-full"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-zinc-400 mt-2">
            {formData.details.isPublic ? '🌐 Public event' : '🔒 Private event'}
          </p>
        </SummaryCard>
      </div>

      {/* Mutation error */}
      {stepErrors && (
        <div className="bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400 font-medium">{stepErrors}</p>
        </div>
      )}
    </div>

    {/* Sticky launch bar */}
    <div
      className="fixed bottom-0 max-md:bottom-24 inset-x-0 bg-(--color-surface) border-t border-(--color-border) p-4 z-50"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onSubmit('published')}
          disabled={isPending}
          className="w-full bg-violet-600 text-white font-bold py-3 px-8 rounded-full active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isPending ? 'Launching…' : '🚀 Publish Event'}
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrev}
            className="bg-(--color-surface) border border-(--color-border) text-zinc-300 font-bold py-2.5 px-6 rounded-full hover:bg-zinc-800 active:scale-95 transition-all text-sm"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onSubmit('draft')}
            disabled={isPending}
            className="flex-1 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors text-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
