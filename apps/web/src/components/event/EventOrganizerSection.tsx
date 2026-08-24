'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { initials } from '@comfytag/utils'
import { useFollowStatus, useFollowOrganizer } from '@/hooks/useEvents'
import { useAuthModal } from '@/hooks/useAuthModal'

interface EventOrganizerSectionProps {
  organizer: {
    _id: string
    name: string
    image?: string
  }
  organizerSlug: string
  followerCount: number
}

export function EventOrganizerSection({ organizer, organizerSlug, followerCount }: EventOrganizerSectionProps) {
  const { data: session } = useSession()
  const { openModal } = useAuthModal()
  const { data: followStatus } = useFollowStatus(organizer._id)
  const { mutate: toggleFollow, isPending } = useFollowOrganizer()

  const [isFollowing, setIsFollowing] = useState(false)
  const [followerDisplay, setFollowerDisplay] = useState(followerCount)

  useEffect(() => {
    if (!followStatus) return
    setIsFollowing(followStatus.following)
    setFollowerDisplay(followStatus.followerCount)
  }, [followStatus])

  function handleFollow() {
    if (!session) { openModal('login'); return }
    const wasFollowing = isFollowing
    setIsFollowing(!wasFollowing)
    setFollowerDisplay((c) => (wasFollowing ? c - 1 : c + 1))
    toggleFollow(
      { organizerId: organizer._id, slug: organizerSlug },
      { onError: () => { setIsFollowing(wasFollowing); setFollowerDisplay(followerCount) } }
    )
  }

  const profileHref = `/organizer/${organizerSlug}`

  return (
    <section className="p-6 sm:p-8 bg-(--color-surface-2) rounded-xl border border-(--color-border)">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <Link href={profileHref} className="shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-(--color-surface) overflow-hidden bg-brand flex items-center justify-center">
            {organizer.image ? (
              <Image src={organizer.image} alt={organizer.name} width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <span className="text-white font-bold text-2xl">{initials(organizer.name)}</span>
            )}
          </div>
        </Link>
        <div className="grow min-w-0">
          <Link href={profileHref} className="no-underline">
            <h4 className="text-xl font-bold text-(--color-text) mb-1">Organized by {organizer.name}</h4>
          </Link>
          <p className="text-(--color-text-muted) text-sm mb-1">
            {followerDisplay.toLocaleString()} follower{followerDisplay !== 1 ? 's' : ''}
          </p>
          <div className="flex justify-center sm:justify-start gap-3 mt-4">
            <button
              type="button"
              onClick={handleFollow}
              disabled={isPending}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-60 ${
                isFollowing
                  ? 'border border-(--color-border) text-(--color-text) bg-(--color-surface) hover:bg-(--color-surface-2)'
                  : 'bg-brand text-white hover:bg-brand-dark'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <Link
              href={profileHref}
              className="px-6 py-2 rounded-full border border-brand text-brand text-sm font-semibold hover:bg-(--color-brand-alpha-4) transition-all no-underline"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
