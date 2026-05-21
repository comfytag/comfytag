'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { OrganizerCard } from '@/components/ui/OrganizerCard'
import type { OrganizerStats } from '@/components/ui/OrganizerCard'
import { EventCard } from '@/components/ui/EventCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { TabBar } from '@/components/ui/TabBar'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { useAuthGate } from '@/hooks/useAuthGate'
import { Button, EmptyState, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { authHeader, isUpcoming } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import api from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

type ActiveTab = 'upcoming' | 'past'

export default function OrganizerProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: session } = useSession()

  const [stats, setStats] = useState<OrganizerStats | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [events, setEvents] = useState<Event[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unfollowSheetOpen, setUnfollowSheetOpen] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const { gateOpen, closeGate, openGate } = useAuthGate()

  const fetchData = useCallback(async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const [statsRes, followRes, eventsRes] = await Promise.all([
        fetch(`${API}/organizers/${slug}/stats`),
        fetch(`${API}/organizers/${slug}/follow/status`),
        fetch(`${API}/events`),
      ])

      if (statsRes.ok) {
        const s: OrganizerStats = await statsRes.json()
        setStats(s)
      }

      if (followRes.ok) {
        const f: { following: boolean; followerCount: number } = await followRes.json()
        setIsFollowing(f.following)
        setFollowerCount(f.followerCount)
      }

      if (eventsRes.ok) {
        const data: unknown = await eventsRes.json()
        const list = (Array.isArray(data) ? data : (data as Record<string, unknown>).data ?? []) as Event[]
        setEvents(list.filter((e) => e.planner_id === slug))
      }
    } catch {
      setError('Failed to load organizer profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleFollow() {
    if (!session) { openGate('like'); return }
    if (isFollowing) { setUnfollowSheetOpen(true); return }
    try {
      const res = await api.post<{ following: boolean; followerCount: number }>(
        `/organizers/${slug}/follow`,
        null,
        authHeader(session.user.token),
      )
      setIsFollowing(res.data.following)
      setFollowerCount(res.data.followerCount)
    } catch {
      // silent
    }
  }

  async function handleUnfollowConfirm() {
    if (!session) return
    try {
      const res = await api.post<{ following: boolean; followerCount: number }>(
        `/organizers/${slug}/follow`,
        null,
        authHeader(session.user.token),
      )
      setIsFollowing(res.data.following)
      setFollowerCount(res.data.followerCount)
    } catch {
      // silent
    } finally {
      setUnfollowSheetOpen(false)
    }
  }

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

  // Derived organizer data from events
  const organizerName = events[0]?.planner ?? 'Organizer'

  const upcomingEvents = events
    .filter((e) => isUpcoming(e.date) && e.status === 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastEvents = events
    .filter((e) => !isUpcoming(e.date) || e.status === 'ended')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const tabEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents

  const allRecapPhotos = pastEvents.flatMap((e) => e.recapPhotos ?? []).slice(0, 12)

  if (isLoading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner size="lg" centered />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div style={{ maxWidth: '720px', margin: '40px auto', padding: '0 24px' }}>
          <ErrorMessage message={error} onRetry={fetchData} />
        </div>
      </>
    )
  }

  return (
    <>
      <AuthGateSheet isOpen={gateOpen} onClose={closeGate} trigger="like" />

      <BottomSheet
        isOpen={unfollowSheetOpen}
        onClose={() => setUnfollowSheetOpen(false)}
        title={`Unfollow ${organizerName}?`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            You will no longer see updates from this organizer in your feed.
          </p>
          <Button variant="danger" size="md" onClick={handleUnfollowConfirm}>
            Unfollow
          </Button>
          <Button variant="ghost" size="md" onClick={() => setUnfollowSheetOpen(false)}>
            Cancel
          </Button>
        </div>
      </BottomSheet>

      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Organizer profile card */}
        <div style={{ marginTop: '24px', marginBottom: '24px' }}>
          <OrganizerCard
            variant="profile"
            organizer={{
              _id: slug,
              name: organizerName,
              image: undefined,
              isPartner: true,
              isVerify: {},
            }}
            stats={{
              followerCount,
              eventCount: stats?.eventCount ?? 0,
              totalTicketsSold: stats?.totalTicketsSold ?? 0,
            }}
            isFollowing={isFollowing}
            onFollow={handleFollow}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <WhatsAppButton
            href={`https://wa.me/?text=${encodeURIComponent(`Hi ${organizerName}, I found you on ComfyTag and I'm interested in your events.`)}`}
            label="Contact on WhatsApp"
          />
        </div>

        <TabBar
          tabs={[
            { label: 'Upcoming', value: 'upcoming', count: upcomingEvents.length },
            { label: 'Past', value: 'past', count: pastEvents.length },
          ]}
          activeTab={activeTab}
          onChange={(value) => setActiveTab(value as ActiveTab)}
          variant="underline"
        />


        {/* Recap photo gallery (Past tab only) */}
        {activeTab === 'past' && allRecapPhotos.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>Recap Gallery</h2>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {allRecapPhotos.map((url, i) => (
                <img
                  key={url + i}
                  src={url}
                  alt={`Event recap ${i + 1}`}
                  width={160}
                  height={120}
                  style={{ flexShrink: 0, width: 160, height: 120, objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}

        {/* Event grid */}
        {tabEvents.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {tabEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                href={`/events/${event.slug ?? event._id}`}
                isLiked={likedIds.has(event._id)}
                onLike={handleLike}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={activeTab === 'upcoming' ? 'No upcoming events' : 'No past events yet'}
            subtitle={
              activeTab === 'upcoming'
                ? 'Check back soon for new events from this organizer.'
                : 'This organizer has no past events.'
            }
          />
        )}
      </div>
    </>
  )
}
