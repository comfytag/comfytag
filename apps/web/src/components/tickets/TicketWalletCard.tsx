import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Ticket } from '@comfytag/types'
import { formatTime } from '@comfytag/utils'
import { CalendarIcon, MapPinIcon } from '@/components/events/EventIcons'

export interface TicketWalletCardProps {
  ticket: Ticket
  isPast?: boolean
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

interface StatusPill {
  label: string
  className: string
  checkIcon?: boolean
}

function getStatusPill(ticket: Ticket, isPast: boolean): StatusPill {
  if (ticket.status === 'transferred') {
    return { label: 'Transferred', className: 'bg-(--color-surface-2) text-(--color-text-muted)' }
  }
  if (ticket.status === 'refunded') {
    return { label: 'Refunded', className: 'bg-error/10 text-error' }
  }
  if (isPast) {
    return { label: 'Past', className: 'bg-(--color-surface-2) text-(--color-text-muted)' }
  }
  return { label: 'Upcoming', className: 'bg-warning/10 text-warning' }
}

export function TicketWalletCard({ ticket, isPast = false }: TicketWalletCardProps) {
  const pill = getStatusPill(ticket, isPast)
  const rawDate = ticket.eventDate || ticket.date
  const parsedDate = rawDate ? new Date(rawDate) : null
  const dateText =
    parsedDate && !isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      : null

  return (
    <Link
      href={`/tickets/${ticket._id}`}
      className={[
        'group block bg-(--color-surface) rounded-2xl border border-(--color-border) overflow-hidden no-underline',
        'transition-all duration-300 hover:-translate-y-1 hover:border-brand',
        isPast ? 'grayscale-[0.4] opacity-80 hover:grayscale-0 hover:opacity-100' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="relative h-48 bg-(--color-surface-2)">
        {ticket.eventImage ? (
          <Image
            src={ticket.eventImage}
            alt={ticket.eventname}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-(--color-brand) to-(--color-brand-dark)" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${pill.className}`}>
            {pill.checkIcon && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {pill.label}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="text-lg font-bold text-(--color-text) leading-tight line-clamp-2 mb-2 capitalize">
          {toTitleCase(ticket.eventname)}
        </h3>

        {dateText && (
          <div className="flex items-center gap-2 text-(--color-text-muted) mb-4 text-sm">
            <CalendarIcon />
            <span>
              {dateText}
              {ticket.eventTime ? ` • ${formatTime(ticket.eventTime)}` : ''}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-(--color-border)">
          {ticket.eventVenue ? (
            <span className="flex items-center gap-1 text-(--color-text-muted) text-sm truncate min-w-0">
              <MapPinIcon />
              <span className="truncate">{toTitleCase(ticket.eventVenue)}</span>
            </span>
          ) : (
            <span />
          )}
          <span className="text-brand font-bold text-sm shrink-0">
            {ticket.numOfTicket > 1 ? `${ticket.numOfTicket} Tickets` : '1 Ticket'}
          </span>
        </div>
      </div>
    </Link>
  )
}
