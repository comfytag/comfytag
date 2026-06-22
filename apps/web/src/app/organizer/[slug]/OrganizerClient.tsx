'use client'

import React, { useState } from 'react'
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
import { useOrganizerProfile, useFollowOrganizer, useLikeEvent } from '@/hooks/useEvents'

type ActiveTab = 'upcoming' | 'past'

interface OrganizerProfile {
  _id: string
  name: string
  bio?: string
  image?: string
  avatar?: string
  isPartner?: boolean
  isVerify?: {
    email?: boolean
    photo?: boolean
    idCard?: boolean
    address?: boolean
  }
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
  return !!(org.isPartner && org.isVerify?.email && org.isVerify?.photo)
}

function VerifiedBadge() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-label="Verified organizer"
      role="img"
      className="inline-block shrink-0"
    >
      <path
        d="M12 1l2.83 5.74L21 8l-4.5 4.39 1.06 6.19L12 15.77l-5.56 2.81 1.06-6.19L3 8l6.17-.26L12 1z"
        fill="#7C3AED"
      />
      <path
        d="M9.5 13.5L7.5 11.5 6 13l3.5 3.5 7-7-1.5-1.5z"
        fill="white"
      />
    </svg>
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming')
  const [unfollowSheetOpen, setUnfollowSheetOpen] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [followHovered, setFollowHovered] = useState(false)
  const [isFollowing, setIsFollowing] = useState(initialProfile?.isFollowing ?? false)

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
    likeMutate({ eventId, slug: eventSlug })
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
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

  // Social proof metric — sum of all public ticket tier capacities
  const totalAttendeePool = events.reduce(
    (sum, event) => sum + event.ticketType.reduce((s, t) => s + t.capacity, 0),
    0
  )

  const liveEventsCount = upcomingEvents.length
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

      {/* ── Block 1: Dark Premium Hero Canopy ──────────────────────────────── */}
      <div className="w-full bg-linear-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white pt-28 pb-12 border-b border-zinc-800">
        <div className="max-w-350 mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">

          {/* Avatar + Identity */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
            {/* Avatar frame */}
            <div className="relative w-28 h-28 shrink-0 rounded-full overflow-hidden border-2 border-zinc-700 ring-4 ring-violet-500/20 shadow-xl">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={capitalizeWords(organizerName)}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-violet-600 text-3xl font-bold text-white select-none">
                  {initials(organizerName)}
                </div>
              )}
            </div>

            {/* Name + badge */}
            <div className="pb-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                  {capitalizeWords(organizerName)}
                </h1>
                {verified && <VerifiedBadge />}
              </div>
              <p className="mt-1 text-sm text-zinc-400">Organizer on ComfyTag</p>
            </div>
          </div>

          {/* Block 2: Social Proof Statistics Row */}
          <div className="flex shrink-0 items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">
                {followerCount.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-zinc-400">
                Followers
              </div>
            </div>
            <div className="h-10 w-px shrink-0 bg-zinc-700" aria-hidden="true" />
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">{liveEventsCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-zinc-400">
                Live Experiences
              </div>
            </div>
            <div className="h-10 w-px shrink-0 bg-zinc-700" aria-hidden="true" />
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">
                {totalAttendeePool.toLocaleString()}+
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-zinc-400">
                Community Pool
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Block 3: Wide 2-Column Desktop Grid Split ──────────────────────── */}
      <div className="max-w-350 mx-auto grid grid-cols-1 items-start gap-8 px-4 pb-20 md:px-8 mt-12 lg:grid-cols-4">

        {/* ── Left Aside Column (25%) ─────────────────────────────────────── */}
        <aside className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm sticky top-28 space-y-6 lg:col-span-1">
          {/* Bio block */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
              About
            </p>
            <p className="text-sm leading-relaxed text-zinc-600">
              {organizer.bio ??
                'Curating premium live entertainment experiences on the ComfyTag network.'}
            </p>
          </div>

          {/* Follow Creator — solid black CTA */}
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
              'w-full rounded-2xl py-3 text-sm font-bold transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
              isFollowing
                ? followHovered
                  ? 'border border-red-400 bg-red-50/70 text-red-500'
                  : 'border border-zinc-200 bg-transparent text-zinc-500 hover:bg-zinc-50'
                : 'border border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800',
            ].join(' ')}
          >
            {isFollowing
              ? followHovered
                ? 'Unfollow'
                : 'Following'
              : 'Follow Creator'}
          </button>

          {/* Share link pill */}
          <button
            onClick={() => { void handleShare() }}
            aria-label="Share this organizer profile"
            className={[
              'flex w-full items-center justify-center gap-2 rounded-2xl',
              'border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-500',
              'transition-colors hover:bg-zinc-50 hover:text-zinc-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
            ].join(' ')}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share Profile
          </button>
        </aside>

        {/* ── Right Grid Canvas (75%) ─────────────────────────────────────── */}
        <div className="lg:col-span-3">

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
                    ? 'bg-white text-zinc-900 shadow-sm'
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
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-8 py-16 text-center">
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
      </div>
    </>
  )
}
