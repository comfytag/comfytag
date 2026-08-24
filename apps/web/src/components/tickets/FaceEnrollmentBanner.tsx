'use client'

import { useState, useEffect } from 'react'
import type { User } from '@comfytag/types'

export interface FaceEnrollmentBannerProps {
  user: User
  onDismiss: () => void
  title?: string
  body?: string
}

const DEFAULT_TITLE = 'Face check-in is coming soon.'
const DEFAULT_BODY  =
  "We're building frictionless, biometric gate check-in — no more scrambling for emails at the door. For now, your QR ticket gets you in."

export function FaceEnrollmentBanner({ user, onDismiss, title, body }: FaceEnrollmentBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const isDismissed = localStorage.getItem('face-enrollment-banner-dismissed')
    if (isDismissed) setIsVisible(false)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('face-enrollment-banner-dismissed', 'true')
    onDismiss()
  }

  if (!isVisible) return null

  return (
    <div className="p-6 bg-linear-to-br from-violet-600 to-indigo-600 text-white rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
      {/* ── Left: conversion copy ── */}
      <div className="flex-1 min-w-0 relative z-10">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-widest bg-white/20 text-white/90 px-3 py-1 rounded-full mb-3">
          Coming Soon
        </span>
        <h2 className="text-xl font-bold tracking-tight mb-2 leading-snug">
          {title ?? DEFAULT_TITLE}
        </h2>
        <p className="text-sm text-white/80 leading-relaxed max-w-sm">
          {body ?? DEFAULT_BODY}
        </p>
      </div>

      {/* ── Right: dismiss ── */}
      <div className="flex items-center gap-3 shrink-0 relative z-10">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss face enrollment banner"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white/80 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-1 focus-visible:ring-offset-violet-600"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
