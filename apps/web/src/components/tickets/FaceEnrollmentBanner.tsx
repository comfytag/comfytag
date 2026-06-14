'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@comfytag/types'

export interface FaceEnrollmentBannerProps {
  user: User
  onDismiss: () => void
}

export function FaceEnrollmentBanner({ user, onDismiss }: FaceEnrollmentBannerProps) {
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
    <div className="p-6 bg-linear-to-br from-violet-600 to-indigo-600 text-white rounded-3xl shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
      {/* Decorative ambient glows */}
      <div
        aria-hidden="true"
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-10 left-1/3 w-36 h-36 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none"
      />

      {/* ── Left: conversion copy ── */}
      <div className="flex-1 min-w-0 relative z-10">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-widest bg-white/20 text-white/90 px-3 py-1 rounded-full mb-3">
          Exclusive Upgrade
        </span>
        <h2 className="text-xl font-bold tracking-tight mb-2 leading-snug">
          Your face is your entry pass.
        </h2>
        <p className="text-sm text-white/80 leading-relaxed max-w-sm">
          Tired of scrambling for emails at the door? Link your biometric pass now to step cleanly through gate check-ins automatically.
        </p>
      </div>

      {/* ── Right: CTA + dismiss ── */}
      <div className="flex items-center gap-3 shrink-0 relative z-10">
        <Link
          href="/enroll"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-violet-600"
        >
          Enroll Face Pass
        </Link>
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
