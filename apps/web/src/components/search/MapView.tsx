'use client'

import { useEffect, useRef, useState } from 'react'
import type { Event } from '@comfytag/types'
import { EventCard } from '../ui/EventCard'

export interface MapViewProps {
  events: Event[]
  onEventSelect: (id: string) => void
  onClose?: () => void
}

/**
 * MapView renders a full-viewport map with event location pins.
 * Tapping a pin shows a compact EventCard at the bottom (card popover).
 *
 * Note: This is a placeholder component that simulates map functionality.
 * In production, integrate with Mapbox GL, Google Maps, or Leaflet.
 */
export function MapView({ events, onEventSelect, onClose }: MapViewProps): React.ReactElement {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const selectedEvent = selectedEventId ? events.find((e) => e._id === selectedEventId) : null

  useEffect(() => {
    // Placeholder: Initialize map library here (Mapbox, Google Maps, Leaflet, etc.)
    // For now, this component renders pins in a grid simulation
  }, [])

  const handlePinClick = (eventId: string): void => {
    setSelectedEventId(eventId)
  }

  const handleClose = (): void => {
    setSelectedEventId(null)
    onClose?.()
  }

  const handleCardSelect = (): void => {
    if (selectedEventId) {
      onEventSelect(selectedEventId)
    }
  }

  return (
    <div
      ref={mapContainerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'var(--color-bg)',
        position: 'relative',
        minHeight: '500px',
      }}
    >
      {/* Map Container (placeholder) */}
      <div
        style={{
          flex: 1,
          background: `linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-2) 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Simulated event pins positioned across the viewport */}
        {events.map((event, index) => {
          // Distribute pins across the viewport in a grid-like pattern
          const row = Math.floor(index / 3)
          const col = index % 3
          const x = 25 + col * 25 // percentage
          const y = 20 + row * 20 // percentage

          return (
            <button
              key={event._id}
              onClick={() => handlePinClick(event._id)}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                border: selectedEventId === event._id ? '3px solid var(--color-brand)' : '2px solid var(--color-border)',
                background: selectedEventId === event._id ? 'var(--color-brand)' : 'var(--color-surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedEventId === event._id ? 'var(--color-text-on-brand)' : 'var(--color-text)',
                fontSize: '16px',
                fontWeight: 700,
                transition: `all var(--duration-fast)`,
                boxShadow: selectedEventId === event._id ? 'var(--shadow-lg)' : 'var(--shadow-md)',
                transform: selectedEventId === event._id ? 'scale(1.1)' : 'scale(1)',
              }}
              title={event.name}
            >
              📍
            </button>
          )
        })}
      </div>

      {/* Bottom Card Popover (shows EventCard compact) */}
      {selectedEvent && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--color-surface)',
            borderTop: `1px solid var(--color-border)`,
            padding: '16px',
            borderRadius: `var(--radius-lg) var(--radius-lg) 0 0`,
            boxShadow: 'var(--shadow-lg)',
            animation: `slideUp var(--duration-fast) var(--ease-entrance)`,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-text)',
                margin: 0,
              }}
            >
              {selectedEvent.name}
            </h3>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              marginBottom: '8px',
              lineHeight: '1.4',
            }}
          >
            <div>{selectedEvent.venue}</div>
            <div>{selectedEvent.date}</div>
          </div>

          <button
            onClick={handleCardSelect}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'var(--color-brand)',
              color: 'var(--color-text-on-brand)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: `background var(--duration-fast)`,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'var(--color-brand-dark)'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'var(--color-brand)'
            }}
          >
            View Event
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
