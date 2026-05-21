'use client'

import React from 'react'
import { Divider } from '@/components/events/EventIcons'

interface EventShareRowProps {
  onShare: () => void
  onHypeLink: () => void
  shareToast: boolean
  hypeLinkLoading: boolean
}

export function EventShareRow({ onShare, onHypeLink, shareToast, hypeLinkLoading }: EventShareRowProps) {
  return (
    <>
      <Divider />
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onShare}
          style={{
            flex: 1,
            minWidth: 120,
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontFamily: 'inherit',
          }}
        >
          <svg
            width="16"
            height="16"
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
          {shareToast ? 'Link Copied ✓' : 'Share Event'}
        </button>

        <button
          type="button"
          onClick={onHypeLink}
          disabled={hypeLinkLoading}
          style={{
            flex: 1,
            minWidth: 120,
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1.5px solid var(--color-brand)',
            background: 'rgba(124,58,237,0.06)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-brand)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            opacity: hypeLinkLoading ? 0.7 : 1,
            fontFamily: 'inherit',
          }}
        >
          🔗 {hypeLinkLoading ? 'Getting link…' : 'Share Hype Link'}
        </button>
      </div>
    </>
  )
}
