'use client'

import { formatDate, formatTime, formatNaira } from '@comfytag/utils'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface LiveTicketPreviewProps {
  formData: CreateEventFormData
}

function TicketPlaceholderIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.5a1.5 1.5 0 1 0 0 3V15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 1 0 0-3V9z" />
    </svg>
  )
}

export function LiveTicketPreview({ formData }: LiveTicketPreviewProps) {
  const hasName = !!formData.name.trim()
  const hasDate = !!formData.date
  const hasVenue = !!formData.venue.trim()
  const hasTiers = formData.tiers.length > 0

  const dateLabel =
    hasDate && formData.startTime
      ? `${formatDate(formData.date)} · ${formatTime(formData.startTime)}`
      : hasDate
        ? formatDate(formData.date)
        : null

  const venueLabel = hasVenue
    ? [formData.venue, formData.state].filter(Boolean).join(', ')
    : null

  return (
    <div>
      {/* Live preview label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Live Preview
        </span>
      </div>

      {/* Ticket card — outer div without overflow-hidden so notch circles can protrude */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl relative">

        {/* Cover image — own overflow-hidden + rounded-t-3xl */}
        <div className="relative h-44 rounded-t-3xl overflow-hidden">
          {formData.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={formData.images[0]}
              alt="Event cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center">
              <TicketPlaceholderIcon />
            </div>
          )}

          {/* Multi-image indicator dots */}
          {formData.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {formData.images.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${
                    i === 0 ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Category badge */}
          {formData.category && (
            <div className="absolute top-3 left-3">
              <span className="bg-white/90 backdrop-blur-sm text-zinc-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                {formData.category}
              </span>
            </div>
          )}
        </div>

        {/* Tear line with side notch circles */}
        <div className="relative h-6 flex items-center px-5">
          <div
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full z-10"
            style={{ backgroundColor: '#f8fafc', border: '1px solid #e4e4e7' }}
          />
          <div className="flex-1 border-t-2 border-dashed border-zinc-200" />
          <div
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full z-10"
            style={{ backgroundColor: '#f8fafc', border: '1px solid #e4e4e7' }}
          />
        </div>

        {/* Content section */}
        <div className="px-6 pb-6 pt-1">
          {/* Event name */}
          <h3
            className={`text-lg font-black leading-snug mb-1.5 transition-colors ${
              hasName ? 'text-zinc-900' : 'text-zinc-300'
            }`}
          >
            {hasName ? formData.name : 'Your Event Name'}
          </h3>

          {/* Date & venue */}
          <div className="space-y-0.5 mb-4">
            <p className={`text-xs font-semibold transition-colors ${dateLabel ? 'text-violet-600' : 'text-zinc-300'}`}>
              {dateLabel ?? '— Date TBD —'}
            </p>
            <p className={`text-xs transition-colors ${venueLabel ? 'text-zinc-500' : 'text-zinc-300'}`}>
              {venueLabel ?? '— Venue TBD —'}
            </p>
          </div>

          {/* Tier stack */}
          {hasTiers && (
            <div className="border-t-2 border-dashed border-zinc-200 pt-3 space-y-1.5">
              {formData.tiers.slice(0, 3).map((tier, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700">{tier.name}</span>
                  <span className="text-xs font-black text-violet-600">
                    {Number(tier.price) === 0 ? 'Free' : formatNaira(Number(tier.price))}
                  </span>
                </div>
              ))}
              {formData.tiers.length > 3 && (
                <p className="text-[10px] text-zinc-400 font-medium">
                  +{formData.tiers.length - 3} more tier
                  {formData.tiers.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* ComfyTag footer */}
          <div className={`flex items-center gap-1.5 ${hasTiers ? 'mt-4 pt-3 border-t border-zinc-100' : 'mt-4'}`}>
            <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
              ComfyTag
            </span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-zinc-400 text-center mt-3 font-medium">
        Preview updates as you type
      </p>
    </div>
  )
}
