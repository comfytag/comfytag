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
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', minWidth: '280px' }}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--color-text)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-color var(--duration-fast) ease',
        }}
        onMouseEnter={(e) => {
          if (!dropdownOpen) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-brand)'
          }
        }}
        onMouseLeave={(e) => {
          if (!dropdownOpen) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
          }
        }}
      >
        <span>{selectedEvent?.name ?? 'Select an event'}</span>
        <ChevronDown
          size={16}
          style={{
            transition: 'transform var(--duration-fast) ease',
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            maxHeight: '280px',
            overflowY: 'auto',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {events.map(event => (
            <button
              key={event._id}
              onClick={() => {
                onSelectEvent(event._id)
                setDropdownOpen(false)
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: selectedEventId === event._id ? 'var(--color-surface-2)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--color-border)',
                textAlign: 'left',
                fontSize: '14px',
                color: selectedEventId === event._id ? 'var(--color-brand)' : 'var(--color-text)',
                cursor: 'pointer',
                transition: 'background var(--duration-fast) ease, color var(--duration-fast) ease',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-2)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = selectedEventId === event._id ? 'var(--color-surface-2)' : 'transparent'
              }}
            >
              <div style={{ fontWeight: 500, color: 'inherit' }}>{event.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {event.date ? new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No date'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
