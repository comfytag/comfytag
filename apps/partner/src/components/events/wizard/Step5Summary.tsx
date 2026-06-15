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
    <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</p>
        <button
          type="button"
          onClick={onEdit}
          className="text-violet-600 text-xs font-bold hover:text-violet-700 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  )
}

function BackIcon() {
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
    <div className="space-y-5">
      {/* Celebratory launch header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="text-5xl mb-4" aria-hidden="true">🚀</div>
        <h2 className="text-2xl font-black text-zinc-900">Ready for launch?</h2>
        <p className="text-zinc-500 mt-1.5 text-sm max-w-xs mx-auto">
          Review your event details below. You can always edit before publishing.
        </p>
      </div>

      {/* Summary sections */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-3">
        <SummaryCard title="Event Info" onEdit={() => onGoToStep(1)}>
          <p className="text-sm font-bold text-zinc-900 leading-tight">{formData.name || '—'}</p>
          <p className="text-xs text-zinc-500 mt-1">{dateLabel}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{locationLabel}</p>
          {formData.category && (
            <span className="inline-block mt-2 text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
              {formData.category}
            </span>
          )}
        </SummaryCard>

        <SummaryCard title="Cover Image" onEdit={() => onGoToStep(2)}>
          {formData.coverImage ? (
            <div className="mt-1 w-full h-24 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No cover image uploaded</p>
          )}
        </SummaryCard>

        <SummaryCard title={`Ticket Tiers (${formData.tiers.length})`} onEdit={() => onGoToStep(3)}>
          {formData.tiers.length > 0 ? (
            <div className="space-y-1 mt-1">
              {formData.tiers.map((tier, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-zinc-800">{tier.name}</span>
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
          <p className="text-sm text-zinc-700 leading-relaxed line-clamp-3">
            {formData.description || <span className="text-zinc-400">No description added</span>}
          </p>
          {formData.performers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formData.performers.map((p, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-zinc-500 mt-2">
            {formData.details.isPublic ? '🌐 Public event' : '🔒 Private event'}
          </p>
        </SummaryCard>
      </div>

      {/* Mutation error */}
      {stepErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600 font-medium">{stepErrors}</p>
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-3">
        {/* Primary — massive publish button */}
        <button
          type="button"
          onClick={() => onSubmit('published')}
          disabled={isPending}
          className="w-full bg-violet-600 text-white font-black text-base py-5 rounded-full hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          {isPending ? 'Launching…' : '🚀 Publish Event'}
        </button>

        {/* Secondary — save as draft */}
        <button
          type="button"
          onClick={() => onSubmit('draft')}
          disabled={isPending}
          className="w-full text-sm font-semibold text-zinc-500 hover:text-zinc-700 py-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save as Draft Instead
        </button>

        {/* Back */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <BackIcon />
            Back to Details
          </button>
        </div>
      </div>
    </div>
  )
}
