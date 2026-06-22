'use client'

import React from 'react'
import { formatNaira } from '@comfytag/utils'

interface EventStickyBarProps {
  isVisible: boolean
  minPrice: number
  allSoldOut: boolean
  isPast?: boolean
  onGetTickets: () => void
}

export function EventStickyBar({ isVisible, minPrice, allSoldOut, isPast, onGetTickets }: EventStickyBarProps) {
  return (
    <div
      className="fixed bottom-[68px] inset-x-0 bg-white/90 backdrop-blur-xl border-t border-zinc-200/80 p-3 z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] flex justify-between items-center transition-transform duration-300 md:hidden"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      }}
      data-testid="event-sticky-bar"
    >
      <div>
        {allSoldOut ? (
          <span className="text-sm font-bold text-zinc-400">Sold Out</span>
        ) : (
          <>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold mb-0.5">
              Tickets from
            </p>
            <span className="text-sm font-bold text-zinc-900">
              {minPrice === 0 ? 'Free' : formatNaira(minPrice)}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        disabled={allSoldOut || !!isPast}
        onClick={onGetTickets}
        className="bg-zinc-900 text-white font-bold py-3.5 px-8 rounded-full shadow-md active:scale-95 transition-all w-1/2 flex justify-center items-center gap-2 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
      >
        {isPast ? 'Ended' : allSoldOut ? 'Sold Out' : 'Get Tickets'}
      </button>
    </div>
  )
}
