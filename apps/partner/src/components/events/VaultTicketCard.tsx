'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@comfytag/types'
import { formatDate, formatNaira } from '@comfytag/utils'

interface VaultTicketCardProps {
  event: Event
  isDuplicating: boolean
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-950/40 text-emerald-400',
  draft: 'bg-zinc-800 text-zinc-400',
  ended: 'bg-zinc-800 text-zinc-500',
  cancelled: 'bg-red-950/40 text-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  published: 'Published',
  draft: 'Draft',
  ended: 'Ended',
  cancelled: 'Cancelled',
}

export function VaultTicketCard({
  event,
  isDuplicating,
  onEdit,
  onDuplicate,
  onDelete,
}: VaultTicketCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const imageSrc = event.coverImage ?? event.images?.[0] ?? '/placeholder.svg'
  const tiers = event.ticketType ?? []
  const totalCapacity = tiers.reduce((sum, t) => sum + t.capacity, 0)
  const revenue = tiers.reduce((sum, t) => sum + t.price * t.sold, 0)
  const soldPct = totalCapacity > 0 ? Math.min((event.sold / totalCapacity) * 100, 100) : 0
  const href = event.status === 'draft' ? `/events/${event._id}/edit` : `/events/${event._id}`

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-4 relative overflow-hidden transition-colors duration-200 hover:border-violet-800 group cursor-pointer">
      <div className="flex gap-4 items-start">
        {/* Poster thumbnail */}
        <Link href={href} className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg">
          <div className="w-12 h-16 rounded-lg overflow-hidden relative bg-zinc-800">
            <Image
              src={imageSrc}
              alt={event.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Status badge row + menu */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status] ?? 'bg-zinc-800 text-zinc-400'}`}
            >
              {STATUS_LABELS[event.status] ?? event.status}
            </span>

            {/* Overflow menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-label="More options"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMenuOpen((p) => !p)
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-8 bg-(--color-surface) border border-(--color-border) rounded-lg z-20 min-w-[148px] overflow-hidden py-1"
                >
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setMenuOpen(false); onEdit() }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    disabled={isDuplicating}
                    onClick={() => { setMenuOpen(false); onDuplicate() }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {isDuplicating ? 'Duplicating…' : 'Duplicate'}
                  </button>
                  <div className="my-1 border-t border-(--color-border)" />
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setMenuOpen(false); onDelete() }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/40 flex items-center gap-2 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Event name */}
          <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded">
            <h3 className="font-bold text-(--color-text) text-sm leading-snug line-clamp-2 group-hover:text-violet-400 transition-colors">
              {event.name}
            </h3>
          </Link>

          {/* Date */}
          <p className="text-xs text-(--color-text-muted) mt-1">
            {event.date ? formatDate(event.date) : 'No date set'}
          </p>

          {/* Stats stub */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dashed border-zinc-800">
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Sold</p>
              <p className="text-sm font-bold text-zinc-200">
                {event.sold.toLocaleString('en-NG')}
                {totalCapacity > 0 && (
                  <span className="font-normal text-zinc-500"> / {totalCapacity.toLocaleString('en-NG')}</span>
                )}
              </p>
            </div>
            {revenue > 0 && (
              <>
                <div className="w-px h-6 bg-zinc-800" />
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Revenue</p>
                  <p className="text-sm font-bold text-zinc-200">{formatNaira(revenue)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Capacity bar */}
      {totalCapacity > 0 && (
        <div className="mt-3 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${soldPct}%` }}
          />
        </div>
      )}
    </div>
  )
}
