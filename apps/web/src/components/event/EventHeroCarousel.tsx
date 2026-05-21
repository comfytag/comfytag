'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

export interface EventHeroCarouselProps {
  images: string[]
  name: string
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

const AUTO_ADVANCE_MS = 5000
const MAX_DOTS = 5
const SWIPE_THRESHOLD = 50

export function EventHeroCarousel({
  images,
  name,
  currentIndex,
  onIndexChange,
}: EventHeroCarouselProps) {
  const slides = images.length > 0 ? images : ['/placeholder.svg']
  const total = slides.length
  const [current, setCurrent] = useState(currentIndex ?? 0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  const goTo = useCallback(
    (index: number) => {
      const newIndex = ((index % total) + total) % total
      setCurrent(newIndex)
      onIndexChange?.(newIndex)
    },
    [total, onIndexChange],
  )

  const prev = useCallback(() => goTo(current - 1), [current, goTo])
  const next = useCallback(() => goTo(current + 1), [current, goTo])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      touchStartXRef.current = e.touches[0].clientX
      touchStartYRef.current = e.touches[0].clientY
    },
    [],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) return

      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current

      // Ignore if vertical scroll
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        touchStartXRef.current = null
        touchStartYRef.current = null
        return
      }

      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        deltaX > 0 ? prev() : next()
      }

      touchStartXRef.current = null
      touchStartYRef.current = null
    },
    [prev, next],
  )

  useEffect(() => {
    if (paused || total <= 1) return
    timerRef.current = setTimeout(() => {
      goTo(current + 1)
    }, AUTO_ADVANCE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [current, paused, total, goTo])

  // Compute which dots to show (sliding window of MAX_DOTS)
  const dotCount = Math.min(total, MAX_DOTS)
  let dotStart = Math.max(0, current - Math.floor(MAX_DOTS / 2))
  if (dotStart + dotCount > total) dotStart = total - dotCount
  const dotIndices = Array.from({ length: dotCount }, (_, i) => dotStart + i)

  return (
    <div
      style={{ position: 'relative', width: '100%' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Aspect-ratio container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          background: 'var(--color-surface-2)',
          overflow: 'hidden',
          touchAction: 'pan-y',
        }}
      >
        <Image
          src={slides[current]}
          alt={`${name} — image ${current + 1} of ${total}`}
          fill
          priority={current === 0}
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, 720px"
        />

        {/* Left arrow */}
        {total > 1 && (
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'var(--color-text-on-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5,
              flexShrink: 0,
              transition: 'background var(--duration-fast) ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.65)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Right arrow */}
        {total > 1 && (
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'var(--color-text-on-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5,
              flexShrink: 0,
              transition: 'background var(--duration-fast) ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.65)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Dot pagination */}
      {total > 1 && (
        <div
          role="tablist"
          aria-label="Image navigation"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 0 6px',
          }}
        >
          {dotIndices.map((idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === current}
              aria-label={`Go to image ${idx + 1}`}
              onClick={() => goTo(idx)}
              style={{
                width: idx === current ? '20px' : '8px',
                height: '8px',
                borderRadius: '99px',
                border: 'none',
                background:
                  idx === current
                    ? 'var(--color-brand)'
                    : 'var(--color-border)',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 200ms ease, background 200ms ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
