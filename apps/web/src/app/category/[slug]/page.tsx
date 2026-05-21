'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { EventCard } from '@/components/ui/EventCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { useAuthGate } from '@/hooks/useAuthGate'
import { EmptyState, LoadingSpinner } from '@comfytag/ui'
import type { Event, Category } from '@comfytag/types'
import { authHeader, isUpcoming } from '@comfytag/utils'
import api from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

export default function CategoryPage() {
  const params = useParams<{ slug: string }>()
  const { data: session } = useSession()
  const [category, setCategory] = useState<Category | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const { gateOpen, closeGate, openGate } = useAuthGate()

  useEffect(() => {
    if (!params.slug) return
    setIsLoading(true)

    Promise.all([
      fetch(`${API}/categories`).then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/events?category=${encodeURIComponent(params.slug)}&status=published`).then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([catData, evtData]) => {
      const catList = (Array.isArray(catData) ? catData : (catData as Record<string, unknown>).data ?? []) as Category[]
      const found = catList.find((c) => c.slug === params.slug || c._id === params.slug) ?? null
      setCategory(found)

      const evtList = (Array.isArray(evtData) ? evtData : (evtData as Record<string, unknown>).data ?? []) as Event[]
      const filtered = evtList.filter(
        (e) => e.status === 'published' && isUpcoming(e.date) && (e.category === params.slug || e.category === found?._id || e.category === found?.title)
      )
      setEvents(filtered)
    }).finally(() => setIsLoading(false))
  }, [params.slug])

  async function handleLike(eventId: string) {
    if (!session) { openGate('like'); return }
    try {
      await api.post(`/events/${eventId}/like`, null, authHeader(session.user.token))
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
          {category?.title ?? params.slug}
        </h1>
        {category?.description && (
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
            {category.description}
          </p>
        )}
      </header>

      {/* Events grid */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 24px 80px' }}>
        {isLoading ? (
          <LoadingSpinner size="lg" centered />
        ) : events.length === 0 ? (
          <EmptyState
            title="No upcoming events in this category"
            subtitle="Check back soon, or browse all events."
            action={{ label: 'Browse all events', href: '/' }}
          />
        ) : (
          <>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              {events.length} upcoming event{events.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {events.map((event) => (
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
