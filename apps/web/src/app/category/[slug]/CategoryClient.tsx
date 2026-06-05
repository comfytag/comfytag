'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { EventCard } from '@/components/ui/EventCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { useAuthGate } from '@/hooks/useAuthGate'
import { EmptyState, LoadingSpinner } from '@comfytag/ui'
import type { Event, Category } from '@comfytag/types'
import { api } from '@/lib/api'

export function CategoryClient({ category, initialEvents }: { category: Category; initialEvents: Event[] }) {
  const { data: session } = useSession()
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const { gateOpen, closeGate, openGate } = useAuthGate()

  async function handleLike(eventId: string) {
    if (!session) {
      openGate('like')
      return
    }
    try {
      await api.post(`/events/${eventId}/like`, null)
      setLikedIds((prev) => {
        const next = new Set(prev)
        if (next.has(eventId)) next.delete(eventId)
        else next.add(eventId)
        return next
      })
    } catch {
      // silent
    }
  }

  const headerBg = category?.gradient ?? 'linear-gradient(135deg, var(--color-brand), var(--color-brand-light))'

  return (
    <>
      <AuthGateSheet isOpen={gateOpen} onClose={closeGate} trigger="like" />
      <Navbar />

      {/* Category header */}
      <header
        style={{
          background: headerBg,
          padding: '48px 24px 36px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {category?.icon && (
          <div style={{ fontSize: '48px', marginBottom: '12px', lineHeight: 1 }} aria-hidden="true">
            {category.icon}
          </div>
        )}
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          {category?.title}
        </h1>
        {category?.description && (
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
            {category.description}
          </p>
        )}
      </header>

      {/* Events grid */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 24px 80px' }}>
        {initialEvents.length === 0 ? (
          <EmptyState
            title="No upcoming events in this category"
            subtitle="Check back soon, or browse all events."
            action={{ label: 'Browse all events', href: '/' }}
          />
        ) : (
          <>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              {initialEvents.length} upcoming event{initialEvents.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {initialEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  href={`/events/${event.slug ?? event._id}`}
                  isLiked={likedIds.has(event._id)}
                  onLike={handleLike}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}
