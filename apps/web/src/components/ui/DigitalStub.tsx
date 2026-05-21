'use client'

import React from 'react'
import type { Ticket, Event } from '@comfytag/types'
import { formatDate, formatTime } from '@comfytag/utils'

export interface DigitalStubProps {
  ticket: Ticket
  event: Event
  qrDataUrl?: string
  scanState?: 'idle' | 'used' | 'failed'
  secondsUntilRefresh?: number
}

export function DigitalStub({
  ticket,
  event,
  qrDataUrl,
  scanState = 'idle',
  secondsUntilRefresh,
}: DigitalStubProps) {
  const isUsed = scanState === 'used'

  return (
    <>
      <style>{`
        @keyframes __ct_pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          filter: isUsed ? 'grayscale(0.5)' : undefined,
        }}
      >
        {/* Left accent strip */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: 'var(--color-brand)',
          }}
          aria-hidden="true"
        />

        {/* Top section */}
        <div style={{ padding: '20px 20px 16px 24px' }}>
          {/* Event name */}
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '8px',
              lineHeight: 1.3,
            }}
          >
            {event.name}
          </div>

          {/* Date + time */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              marginBottom: '4px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{formatDate(event.date)}</span>
            <span>·</span>
            <span>{formatTime(event.startTime)}</span>
          </div>

          {/* Venue */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              marginBottom: '12px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {event.venue}
            </span>
          </div>

          {/* Tier badge */}
          <div style={{ marginBottom: '8px' }}>
            <span
              style={{
                background: 'var(--color-surface-2)',
                color: 'var(--color-text)',
                fontSize: '12px',
                padding: '2px 10px',
                borderRadius: '99px',
                display: 'inline-block',
              }}
            >
              {ticket.type}
            </span>
          </div>

          {/* Reference */}
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.05em',
            }}
          >
            Ref: {ticket.reference}
          </div>
        </div>

        {/* Perforation line */}
        <div
          style={{
            position: 'relative',
            borderTop: '2px dashed var(--color-border)',
            margin: '0 -0px',
          }}
        >
          {/* Left notch */}
          <div
            style={{
              position: 'absolute',
              left: '-12px',
              top: '-13px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--color-bg)',
              border: '2px dashed var(--color-border)',
            }}
            aria-hidden="true"
          />
          {/* Right notch */}
          <div
            style={{
              position: 'absolute',
              right: '-12px',
              top: '-13px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--color-bg)',
              border: '2px dashed var(--color-border)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Bottom section */}
        <div
          style={{
            padding: '16px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* QR area */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                width={180}
                height={180}
                alt="Ticket QR"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: '#ffffff',
                  padding: '8px',
                  display: 'block',
                  filter: isUsed ? 'grayscale(1) opacity(0.4)' : undefined,
                }}
              />
            ) : (
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  background: 'var(--color-surface-2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                }}
              >
                Loading QR…
              </div>
            )}

            {/* Used stamp overlay */}
            {isUsed && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-20deg)',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--color-success)',
                  border: '3px solid var(--color-success)',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  opacity: 0.8,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                Entry Granted ✅
              </div>
            )}
          </div>

          {/* LIVE indicator */}
          {!isUsed && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: secondsUntilRefresh !== undefined ? '6px' : '0',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  animation: '__ct_pulse 1.5s ease infinite',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--color-success)',
                  letterSpacing: '0.08em',
                }}
              >
                LIVE
              </span>
            </div>
          )}

          {/* Countdown */}
          {secondsUntilRefresh !== undefined && !isUsed && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}
              >
                00:{secondsUntilRefresh.toString().padStart(2, '0')}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                }}
              >
                QR refreshes in
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
