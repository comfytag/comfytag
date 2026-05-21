'use client'

import React from 'react'
import { CalendarIcon, MapPinIcon, HeartIcon } from '@/components/events/EventIcons'
import { formatDate, formatTime } from '@comfytag/utils'
import type { Event } from '@comfytag/types'

interface EventMetaProps {
  event: Event
  isLiked: boolean
  likeCount: number | undefined
  onLike: () => void
}

export function EventMeta({ event, isLiked, likeCount, onLike }: EventMetaProps) {
  return (
    <div>
      <h1
        style={{
          fontSize: '26px',
          fontWeight: 800,
          color: 'var(--color-text)',
          lineHeight: 1.25,
          marginBottom: '16px',
        }}
      >
        {event.name}
      </h1>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          color: 'var(--color-text-muted)',
          fontSize: '14px',
        }}
      >
        <CalendarIcon />
        <span>
          {formatDate(event.date)} · {formatTime(event.startTime)}
          {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          marginBottom: '18px',
          color: 'var(--color-text-muted)',
          fontSize: '14px',
        }}
      >
        <MapPinIcon />
        <span>
          {event.venue}
          {event.address ? `, ${event.address}` : ''}
          {event.state ? `, ${event.state}` : ''}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={onLike}
          aria-pressed={isLiked}
          aria-label={isLiked ? 'Unlike event' : 'Like event'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '99px',
            border: `1.5px solid ${isLiked ? 'var(--color-error)' : 'var(--color-border)'}`,
            background: isLiked ? 'rgba(239,68,68,0.06)' : 'var(--color-surface)',
            color: isLiked ? 'var(--color-error)' : 'var(--color-text-muted)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'border-color 150ms, background 150ms, color 150ms',
          }}
        >
          <HeartIcon filled={isLiked} />
          {(likeCount ?? 0) > 0 && <span>{(likeCount ?? 0).toLocaleString()}</span>}
        </button>

        {event.category && (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '99px',
              background: 'rgba(124,58,237,0.08)',
              color: 'var(--color-brand)',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {event.category}
          </span>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        {event.sold > 0 ? (
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-brand)', margin: 0 }}>
            {event.sold.toLocaleString()} people going
          </p>
        ) : (
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Be the first!
          </p>
        )}
      </div>
    </div>
  )
}
