'use client'
import React, { useState } from 'react'
import { Button } from '@comfytag/ui'

interface EventTransparentNavProps {
  onBack: () => void
  onShare: () => void | Promise<void>
  onGetTickets?: () => void
  allSoldOut?: boolean
}

export function EventTransparentNav({ onBack, onShare, onGetTickets, allSoldOut }: EventTransparentNavProps) {
  const [hovering, setHovering] = useState(false)
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .event-transparent-nav-buttons {
            opacity: 1 !important;
          }
        }
      `}</style>
      <div
        className="event-transparent-nav-buttons"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          background: hovering
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)'
            : 'transparent',
          pointerEvents: 'auto',
          transition: 'background 200ms ease',
          opacity: hovering ? 1 : 0,
        }}
      >
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: hovering ? 'rgba(0,0,0,0.45)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          backdropFilter: hovering ? 'blur(4px)' : 'none',
          transition: 'background 200ms ease',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onShare}
        aria-label="Share event"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: hovering ? 'rgba(0,0,0,0.45)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          backdropFilter: hovering ? 'blur(4px)' : 'none',
          transition: 'background 200ms ease',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>
    </div>
    </>
  )
}
