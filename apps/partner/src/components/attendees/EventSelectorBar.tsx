'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Event } from '@comfytag/types'

interface EventSelectorBarProps {
  events: Event[]
  selectedEventId: string
  onSelectEvent: (eventId: string) => void
}

export function EventSelectorBar({ events, selectedEventId, onSelectEvent }: EventSelectorBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedEvent = events.find(e => e._id === selectedEventId)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  return (
    <div ref={dropdownRef} className="relative inline-block min-w-70">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full flex items-center justify-between gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
      >
        <span>{selectedEvent?.name ?? 'Select an event'}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`text-zinc-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-zinc-200/80 rounded-xl z-10 max-h-72 overflow-y-auto">
          {events.map(event => (
            <button
              key={event._id}
              onClick={() => {
                onSelectEvent(event._id)
                setDropdownOpen(false)
              }}
              className={`w-full text-left px-4 py-3 text-sm border-b border-zinc-100 last:border-0 transition-colors ${
                selectedEventId === event._id
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <div className="font-semibold">{event.name}</div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {event.date
                  ? new Date(event.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'No date'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
