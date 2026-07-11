import React from 'react'
import Link from 'next/link'
import type { Ticket } from '@comfytag/types'

export interface TicketListItemProps {
  ticket: Ticket
  isPast?: boolean
  onAction?: (action: 'show-qr' | 'transfer' | 'details', ticket: Ticket) => void
}

// ── Title case helper ─────────────────────────────────────────────────────────
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

// ── Tier badge colour map ──────────────────────────────────────────────────────
const TIER_STYLES: Array<[string, string]> = [
  ['early bird', 'bg-amber-50 text-amber-700 border-amber-200'],
  ['vip',        'bg-violet-50 text-violet-700 border-violet-200'],
  ['early',      'bg-amber-50 text-amber-700 border-amber-200'],
]

function resolveTierStyle(type: string): string {
  const lower = type.toLowerCase()
  for (const [key, cls] of TIER_STYLES) {
    if (lower.includes(key)) return cls
  }
  return 'bg-zinc-100 text-zinc-600 border-zinc-200'
}

// ── Calendar date block ───────────────────────────────────────────────────────
function CalendarBlock({ dateStr }: { dateStr?: string }) {
  if (!dateStr) {
    return (
      <div className="w-12 h-12 rounded-xl bg-zinc-100 shrink-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">—</span>
      </div>
    )
  }

  const d = new Date(dateStr)
  const month = d.toLocaleString('en', { month: 'short' }).toUpperCase()
  const day   = d.getDate()

  return (
    <div className="w-12 h-14 rounded-xl bg-zinc-100 shrink-0 flex flex-col items-center justify-center gap-0.5">
      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">{month}</span>
      <span className="text-xl font-black text-zinc-800 leading-none">{day}</span>
    </div>
  )
}

// ── Map pin icon ─────────────────────────────────────────────────────────────
function PinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="w-3 h-3 shrink-0"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM2.5 6a5.5 5.5 0 1 1 9.448 3.832l-3.33 4.163a.75.75 0 0 1-1.236 0L4.052 9.832A5.48 5.48 0 0 1 2.5 6ZM8 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ── Clock icon ───────────────────────────────────────────────────────────────
function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="w-3 h-3 shrink-0"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7-4.75a.75.75 0 0 1 .75.75v3.75h2.5a.75.75 0 0 1 0 1.5h-3.25a.75.75 0 0 1-.75-.75V4a.75.75 0 0 1 .75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ── TicketListItem ────────────────────────────────────────────────────────────
export function TicketListItem({ ticket, isPast, onAction }: TicketListItemProps) {
  const isExpired =
    isPast ||
    ticket.status === 'used' ||
    ticket.status === 'transferred' ||
    ticket.status === 'refunded'

  const tierStyle = resolveTierStyle(ticket.type)

  const handleAction = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: 'show-qr' | 'transfer' | 'details'
  ): void => {
    e.preventDefault()
    e.stopPropagation()
    onAction?.(action, ticket)
  }

  return (
    <Link
      href={`/tickets/${ticket._id}`}
      className={[
        'w-full bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5',
        'hover:border-zinc-300 transition-all',
        'flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 relative',
        'no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
        isExpired ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── Top block: calendar + event info (badge lives inside) ── */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <CalendarBlock dateStr={ticket.eventDate || ticket.date} />

        <div className="min-w-0 flex-1">
          {/* Title row: event name + tier badge inline */}
          <div className="flex items-start gap-2 min-w-0">
            <p className="text-lg font-bold text-zinc-900 line-clamp-1 leading-snug flex-1 min-w-0">
              {toTitleCase(ticket.eventname)}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border uppercase tracking-wide whitespace-nowrap ${tierStyle}`}
              >
                {ticket.type}
              </span>
              {ticket.numOfTicket > 1 && (
                <span className="text-xs text-zinc-500 font-medium tabular-nums">
                  ×{ticket.numOfTicket}
                </span>
              )}
            </div>
          </div>

          {ticket.eventVenue && (
            <p className="flex items-center gap-1 text-xs text-zinc-500 truncate mt-0.5">
              <PinIcon />
              {toTitleCase(ticket.eventVenue)}
            </p>
          )}

          {ticket.eventTime && (
            <p className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
              <ClockIcon />
              {ticket.eventTime}
              {ticket.eventEndTime && ` – ${ticket.eventEndTime}`}
            </p>
          )}
          {ticket.ticketNumber != null && (
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              #{ticket.ticketNumber}
            </p>
          )}
        </div>
      </div>

      {/* ── Bottom block: action buttons / chevron ── */}
      {!isExpired ? (
        <div
          className="w-full sm:w-auto flex items-center gap-3 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-zinc-100"
          onClick={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={(e) => handleAction(e, 'show-qr')}
            className="w-full sm:w-auto flex-1 sm:flex-none px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1"
          >
            View Pass
          </button>
          <button
            type="button"
            onClick={(e) => handleAction(e, 'transfer')}
            className="w-full sm:w-auto flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1"
          >
            Transfer
          </button>
        </div>
      ) : (
        <span className="hidden sm:block text-zinc-300 text-xl shrink-0 select-none" aria-hidden="true">
          ›
        </span>
      )}
    </Link>
  )
}
