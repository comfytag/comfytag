'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@comfytag/types'
import { formatDate, formatNaira } from '@comfytag/utils'

interface VaultLiveCardProps {
  event: Event
  isDuplicating: boolean
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function VaultLiveCard({
  event,
  isDuplicating,
  onEdit,
  onDuplicate,
  onDelete,
}: VaultLiveCardProps) {
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

  return (
    <div className="max-w-3xl w-full">
      <div className="bg-(--color-surface) border border-red-900/50 rounded-xl overflow-hidden transition-colors duration-300 hover:border-red-800">
        <div className="flex h-40 sm:h-48">
          {/* Cover image */}
          <div className="relative w-36 sm:w-52 shrink-0">
            <Image
              src={imageSrc}
              alt={event.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 144px, 208px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
            {/* Live beacon + menu */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {/* Pulsing red beacon */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                  Live Now
                </span>
              </div>

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
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      role="menuitem"
                      type="button"
                      disabled={isDuplicating}
                      onClick={() => { setMenuOpen(false); onDuplicate() }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDuplicating ? 'Duplicating…' : 'Duplicate'}
                    </button>
                    <div className="my-1 border-t border-(--color-border)" />
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { setMenuOpen(false); onDelete() }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/40 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Event info */}
            <div>
              <Link
                href={`/events/${event._id}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
              >
                <h2 className="font-black text-(--color-text) text-lg sm:text-xl leading-tight hover:text-violet-400 transition-colors line-clamp-2">
                  {event.name}
                </h2>
              </Link>
              <p className="text-xs text-(--color-text-muted) mt-1">
                {event.venue}
                {event.date && ` · ${formatDate(event.date)}`}
              </p>
            </div>

            {/* Live stats */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Sold</p>
                <p className="text-sm font-bold text-(--color-text)">
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
                    <p className="text-sm font-bold text-(--color-text)">{formatNaira(revenue)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live capacity progress bar */}
        <div className="h-1 bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-700"
            style={{ width: `${soldPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
