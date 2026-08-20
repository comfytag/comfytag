'use client'

import React, { useRef, useState } from 'react'
import type { Event } from '@comfytag/types'

export interface EventMediaGalleryProps {
  event: Event
  isOrganizer?: boolean
  onUpload?: (file: File) => void
}

export function EventMediaGallery({ event, isOrganizer, onUpload }: EventMediaGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Only show if event has ended
  if (event.status !== 'ended') {
    return null
  }

  // Use recapPhotos if available, otherwise empty
  const media = event.recapPhotos || []

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file || !onUpload) return

    setIsUploading(true)
    try {
      await onUpload(file)
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Show upload prompt if no media
  if (media.length === 0) {
    return (
      <div style={{ marginTop: '48px' }}>
        <h2 className="text-xl font-bold text-(--color-text) border-l-4 border-brand pl-4 mb-5">
          Event Media
        </h2>
        {isOrganizer ? (
          <div
            style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'background var(--duration-fast) ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-2)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent'
            }}
            onClick={handleUploadClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleUploadClick()
              }
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto 12px' }}
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
              Upload event photos
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Share memories from this event
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
          </div>
        ) : null}
      </div>
    )
  }

  // Masonry grid with media
  return (
    <div style={{ marginTop: '48px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2 className="text-xl font-bold text-(--color-text) border-l-4 border-brand pl-4">
          Event Media
        </h2>
        {isOrganizer && (
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            style={{
              padding: '8px 16px',
              background: 'var(--color-brand)',
              color: 'var(--color-text-on-brand)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.6 : 1,
              transition: 'opacity var(--duration-fast) ease',
            }}
          >
            {isUploading ? 'Uploading...' : '+ Add Photo'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
      </div>

      {/* Masonry grid: responsive columns */}
      <style>{`
        .__ct_media_gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        @media (max-width: 640px) {
          .__ct_media_gallery {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
      <div
        className="__ct_media_gallery"
      >
        {media.map((url, idx) => (
          <div
            key={idx}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: 'var(--color-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {url.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                controls
              />
            ) : (
              <img
                src={url}
                alt={`Event media ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
