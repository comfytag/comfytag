'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Share2 } from 'lucide-react'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { EventCard } from '@/components/ui/EventCard'
import { AuthGateSheet } from '@/components/ui/AuthGateSheet'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useAuthGate } from '@/hooks/useAuthGate'
import { initials } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import { useOrganizerProfile, useFollowOrganizer, useFollowStatus, useLikeEvent } from '@/hooks/useEvents'

type ActiveTab = 'upcoming' | 'past'

interface OrganizerProfile {
  _id: string
  name: string
  bio?: string
  image?: string
  avatar?: string
  bgImg?: string
  isPartner?: boolean
  isVerify?: {
    email?: boolean
  }
  kycStatus?: string
  followerCount?: number
  followers?: unknown[]
  eventCount?: number
  totalTicketsSold?: number
  events?: Event[]
}

interface InitialProfile {
  organizer: OrganizerProfile
  stats?: {
    eventCount: number
    followerCount: number
    totalTicketsSold: number
  }
  events: Event[]
  isFollowing?: boolean
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

function isVerified(org: OrganizerProfile): boolean {
  return !!(org.isPartner && org.isVerify?.email && org.kycStatus === 'verified')
}

function VerifiedBadge() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      className="inline-block shrink-0"
    >
      <path
        d="M12 1l2.83 5.74L21 8l-4.5 4.39 1.06 6.19L12 15.77l-5.56 2.81 1.06-6.19L3 8l6.17-.26L12 1z"
        fill="white"
      />
      <path d="M9.5 13.5L7.5 11.5 6 13l3.5 3.5 7-7-1.5-1.5z" fill="var(--color-brand)" />
    </svg>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border) flex items-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-(--color-brand-alpha-8) text-brand flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-(--color-text) tabular-nums">{value}</div>
        <div className="text-sm text-(--color-text-muted)">{label}</div>
      </div>
    </div>
  )
}

export function OrganizerClient({
  slug,
  initialProfile,
}: {
  slug: string
  initialProfile: InitialProfile
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const { data } = useOrganizerProfile(slug)
  const organizer = (data ?? initialProfile.organizer) as OrganizerProfile

  const { mutate: followMutate } = useFollowOrganizer()
  const { mutate: likeMutate } = useLikeEvent()
  const { data: followStatus } = useFollowStatus(organizer._id)

  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming')
  const [unfollowSheetOpen, setUnfollowSheetOpen] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [followHovered, setFollowHovered] = useState(false)
  const [isFollowing, setIsFollowing] = useState(initialProfile?.isFollowing ?? false)

  // The server never fetches a personalized isFollowing flag up front (only
  // aggregate follower counts), so hydrate the real value once this loads —
  // without it the button always shows "Follow" even for organizers the
  // user already follows.
  useEffect(() => {
    if (followStatus) setIsFollowing(followStatus.following)
  }, [followStatus])

  const { gateOpen, closeGate, openGate } = useAuthGate()

  function handleFollow() {
    if (status !== 'authenticated' || !session) {
      router.push('/login')
      return
    }
    if (!organizer._id) return
    followMutate(
      { organizerId: organizer._id, slug },
      { onSuccess: (resp: { following: boolean }) => setIsFollowing(resp.following) }
    )
  }

  function handleUnfollowConfirm() {
    if (status !== 'authenticated' || !session) {
      router.push('/login')
      return
    }
    if (!organizer._id) return
    followMutate(
      { organizerId: organizer._id, slug },
      { onSuccess: (resp: { following: boolean }) => setIsFollowing(resp.following) }
    )
    setUnfollowSheetOpen(false)
  }

  function handleLike(eventId: string) {
    if (!session) {
      openGate('like')
      return
    }
    const eventSlug = events.find((e: Event) => e._id === eventId)?.slug ?? eventId
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
    likeMutate(
      { eventId, slug: eventSlug },
      {
        onError: () => {
          setLikedIds((prev) => {
            const next = new Set(prev)
            if (next.has(eventId)) next.delete(eventId)
            else next.add(eventId)
            return next
          })
        },
      },
    )
  }

  async function handleShare() {
    if (typeof window === 'undefined') return
    const shareData = {
      title: capitalizeWords(organizer.name),
      text: `Check out ${capitalizeWords(organizer.name)}'s events on ComfyTag`,
      url: window.location.href,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled — silent
      }
    } else {
      void navigator.clipboard?.writeText(window.location.href)
    }
  }

  // ── Derived public data (strict privacy boundary) ─────────────────────────

  const organizerName = organizer.name || 'Organizer'
  const followerCount: number =
    typeof organizer.followerCount === 'number'
      ? organizer.followerCount
      : Array.isArray(organizer.followers)
        ? organizer.followers.length
        : 0

  const events: Event[] = Array.isArray(organizer.events) ? organizer.events : []

  const now = new Date()

  const upcomingEvents = events
    .filter((e: Event) => new Date(e.date || 0) >= now)
    .sort(
      (a: Event, b: Event) =>
        new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
    )

  const pastEvents = events
    .filter((e: Event) => new Date(e.date || 0) < now)
    .sort(
      (a: Event, b: Event) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    )

  const tabEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents

  // Real attendance — tickets actually sold, not raw tier capacity
  const totalAttendees = events.reduce((sum, event) => sum + (event.sold ?? 0), 0)

  const verified = isVerified(organizer)
  const avatarSrc = organizer.avatar ?? organizer.image

  const allRecapPhotos = pastEvents
    .flatMap((e: Event) => e.recapPhotos ?? [])
    .slice(0, 12)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <AuthGateSheet isOpen={gateOpen} onClose={closeGate} trigger="like" />

      <BottomSheet
        isOpen={unfollowSheetOpen}
        onClose={() => setUnfollowSheetOpen(false)}
        title={`Unfollow ${capitalizeWords(organizerName)}?`}
      >
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm leading-relaxed text-zinc-500">
            You will no longer see updates from this organizer in your feed.
          </p>
          <button
            onClick={handleUnfollowConfirm}
            className="w-full rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            Unfollow
          </button>
          <button
            onClick={() => setUnfollowSheetOpen(false)}
            className="w-full rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </BottomSheet>

      <Navbar />

      {/* ── Hero: cover banner + avatar + identity ─────────────────────── */}
      <div className="relative">
        <div className="relative h-56 sm:h-70 w-full overflow-hidden bg-(--color-surface-2)">
          {organizer.bgImg ? (
            <Image
              src={organizer.bgImg}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-(--color-brand) to-(--color-brand-dark)" />
          )}
        </div>

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="max-w-350 mx-auto px-4 md:px-8 relative -mt-14 sm:-mt-18">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 pb-8 border-b border-(--color-border)">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-(--color-bg) overflow-hidden bg-(--color-surface)">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={capitalizeWords(organizerName)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 112px, 144px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand text-3xl font-bold text-white select-none">
                    {initials(organizerName)}
                  </div>
                )}
              </div>
              {verified && (
                <div className="absolute bottom-1 right-1 bg-brand p-1.5 rounded-full border-2 border-(--color-bg) flex items-center justify-center">
                  <VerifiedBadge />
                </div>
              )}
            </div>

            {/* Name + bio */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-(--color-text)">
                  {capitalizeWords(organizerName)}
                </h1>
                {verified && (
                  <span className="px-3 py-1 bg-(--color-brand-alpha-8) text-brand rounded-full text-xs font-semibold">
                    Verified Organizer
                  </span>
                )}
              </div>
              <p className="text-(--color-text-muted) text-base max-w-2xl leading-relaxed">
                {organizer.bio ??
                  'Curating premium live entertainment experiences on the ComfyTag network.'}
              </p>
            </div>

            {/* Actions: Share + Follow */}
            <div className="flex items-center gap-3 pb-1 shrink-0">
              <button
                onClick={() => { void handleShare() }}
                aria-label="Share this organizer profile"
                className="w-11 h-11 flex items-center justify-center rounded-xl border border-(--color-border) text-(--color-text-muted) hover:bg-(--color-surface-2) transition-colors"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => {
                  if (!isFollowing) {
                    handleFollow()
                  } else {
                    setUnfollowSheetOpen(true)
                  }
                }}
                onMouseEnter={() => setFollowHovered(true)}
                onMouseLeave={() => setFollowHovered(false)}
                aria-pressed={isFollowing}
                aria-label={
                  isFollowing
                    ? followHovered
                      ? 'Unfollow this organizer'
                      : 'Following this organizer'
                    : 'Follow this organizer'
                }
                className={[
                  'px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 text-sm',
                  isFollowing
                    ? followHovered
                      ? 'border border-error text-error bg-error/10'
                      : 'border border-(--color-border) bg-(--color-surface) text-(--color-text) hover:bg-(--color-surface-2)'
                    : 'bg-brand text-white hover:bg-brand-dark',
                ].join(' ')}
              >
                {isFollowing ? (followHovered ? 'Unfollow' : 'Following') : 'Follow'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="max-w-350 mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            value={events.length.toLocaleString()}
            label="Events Hosted"
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M9 16l2 2 4-4" />
              </svg>
            }
          />
          <StatCard
            value={`${totalAttendees.toLocaleString()}+`}
            label="Total Attendees"
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <StatCard
            value={followerCount.toLocaleString()}
            label="Followers"
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* ── Events content ───────────────────────────────────────────────── */}
      <div className="max-w-350 mx-auto px-4 pb-20 md:px-8 mt-12">

          {/* Tab navigation row */}
          <div className="mb-8 flex w-fit items-center gap-1 rounded-2xl bg-zinc-100 p-1">
            {(
              [
                { value: 'upcoming' as const, label: 'Active Events', count: upcomingEvents.length },
                { value: 'past' as const, label: 'Past Recaps', count: pastEvents.length },
              ]
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                aria-pressed={activeTab === tab.value}
                className={[
                  'flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1',
                  activeTab === tab.value
                    ? 'bg-white text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700',
                ].join(' ')}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={[
                      'rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none',
                      activeTab === tab.value
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-zinc-200 text-zinc-500',
                    ].join(' ')}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Recap gallery — past tab only */}
          {activeTab === 'past' && allRecapPhotos.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
                Recap Gallery
              </h2>
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none' } as React.CSSProperties}
              >
                {allRecapPhotos.map((url: string, i: number) => (
                  <Image
                    key={`${url}-${i}`}
                    src={url}
                    alt={`Event recap photo ${i + 1}`}
                    width={160}
                    height={120}
                    className="shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Event grid or empty state */}
          {tabEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {tabEvents.map((event: Event) => (
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
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-8 py-16 text-center">
              <p className="text-sm text-zinc-400">
                {activeTab === 'upcoming'
                  ? 'No upcoming events scheduled yet.'
                  : 'No past events to show.'}
              </p>
              <button
                onClick={() =>
                  setActiveTab(activeTab === 'upcoming' ? 'past' : 'upcoming')
                }
                className="text-sm font-semibold text-violet-600 underline underline-offset-2 hover:text-violet-700 transition-colors"
              >
                View{' '}
                {activeTab === 'upcoming'
                  ? 'past recaps'
                  : 'active events'}{' '}
                instead
              </button>
            </div>
          )}
      </div>
    </>
  )
}
