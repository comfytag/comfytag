'use client'

import { formatNaira, formatDate } from '@comfytag/utils'
import { AttendeeStatusBadge } from './AttendeeStatusBadge'

interface Attendee {
  _id: string
  name: string
  email: string
  phone?: string
  numOfTicket: number
  ticketType?: string
  amount?: number
  date?: string
  status: 'active' | 'used' | 'transferred' | 'refunded' | 'ended'
  checkedIn?: boolean
  checkInDate?: string
}

interface AttendeeRowProps {
  attendee: Attendee
  onCheckInToggle: () => void
  isCheckingIn?: boolean
}

export function AttendeeRow({ attendee, onCheckInToggle, isCheckingIn = false }: AttendeeRowProps) {
  const initial = attendee.name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="group border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: attendee info */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
            <span className="text-zinc-500 font-bold text-sm" aria-hidden="true">
              {initial}
            </span>
          </div>

          <div className="min-w-0">
            {/* Name + status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-900 font-bold tracking-tight text-sm">
                {attendee.name}
              </span>
              <AttendeeStatusBadge status={attendee.status} />
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs font-medium text-zinc-500">{attendee.email}</span>
              {attendee.phone && (
                <span className="text-xs font-medium text-zinc-500">{attendee.phone}</span>
              )}
              {attendee.ticketType && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">{attendee.ticketType}</span>
              )}
              {attendee.amount != null && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                  {formatNaira(attendee.amount)} · {attendee.numOfTicket}×
                </span>
              )}
            </div>

            {/* Check-in timestamp */}
            {attendee.checkedIn && attendee.checkInDate && (
              <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-semibold mt-1">
                ✓ Checked in {formatDate(attendee.checkInDate)}
              </p>
            )}
          </div>
        </div>

        {/* Right: check-in action */}
        {attendee.status === 'active' && (
          <button
            onClick={onCheckInToggle}
            disabled={isCheckingIn}
            className={
              attendee.checkedIn
                ? 'shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs py-2 px-6 rounded-full transition-all disabled:opacity-60 cursor-pointer'
                : 'shrink-0 bg-zinc-900 text-white font-bold text-xs py-2 px-6 rounded-full active:scale-95 transition-all hover:bg-zinc-800 disabled:opacity-60 cursor-pointer'
            }
          >
            {isCheckingIn ? 'Checking in…' : attendee.checkedIn ? '✓ Checked in' : 'Check in'}
          </button>
        )}
      </div>
    </div>
  )
}
