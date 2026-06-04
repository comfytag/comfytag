'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@comfytag/ui'
import { initials } from '@comfytag/utils'
import type { User } from '@comfytag/types'

export interface OrganizerStats {
  followerCount: number
  eventCount: number
  totalTicketsSold: number
}

export interface OrganizerCardProps {
  organizer: {
    _id: string
    name: string
    image?: string
    isPartner: boolean
    isVerify: User['isVerify']
  }
  followerCount?: number
  upcomingEventCount?: number
  onFollow?: () => void
  onProfileClick?: () => void
  isFollowing?: boolean
  href?: string
  variant?: 'card' | 'profile' | 'inline'
  stats?: OrganizerStats
}

function isVerified(organizer: OrganizerCardProps['organizer']): boolean {
  return !!(organizer.isPartner && organizer.isVerify?.email && organizer.isVerify?.photo)
}

function Avatar({
  image,
  name,
  size,
}: {
  image?: string
  name: string
  size: number
}) {
  if (image) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <Image
          src={image}
          alt={name}
          fill
          style={{ objectFit: 'cover' }}
          sizes={`${size}px`}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'var(--color-brand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-on-brand)',
        fontSize: `${size * 0.35}px`,
        fontWeight: 700,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}

function VerifiedBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        background: 'var(--color-brand)',
        color: 'var(--color-text-on-brand)',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 'var(--radius-full)',
        marginLeft: '6px',
        lineHeight: 1.4,
      }}
      title="Verified organizer"
    >
      ✓
    </span>
  )
}

export function OrganizerCard({
  organizer,
  followerCount = 0,
  upcomingEventCount = 0,
  onFollow,
  onProfileClick,
  isFollowing = false,
  href,
  variant,
  stats,
}: OrganizerCardProps) {
  const verified = isVerified(organizer)
  const [hovered, setHovered] = React.useState(false)

  const displayFollowerCount = stats?.followerCount ?? followerCount

  const handleProfileClick = () => {
    onProfileClick?.()
  }

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFollow?.()
  }

  // Inline variant: compact row layout
  if (variant === 'inline') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 0',
        }}
      >
        <Avatar image={organizer.image} name={organizer.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text)',
              }}
            >
              {organizer.name}
            </span>
            {verified && <VerifiedBadge />}
          </div>
        </div>
      </div>
    )
  }

  const cardContent = (
    <div
      onClick={href ? undefined : handleProfileClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: (onProfileClick || href) ? 'pointer' : 'default',
        background: 'var(--color-surface)',
        border: `1px solid ${hovered && (onProfileClick || href) ? 'var(--color-brand)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color var(--duration-default) var(--ease-standard), box-shadow var(--duration-default) var(--ease-standard)',
        boxShadow: hovered && (onProfileClick || href) ? 'var(--shadow-md)' : 'none',
      }}
    >
      {/* Avatar + Name + Verified */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Avatar image={organizer.image} name={organizer.name} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--color-text)',
              }}
            >
              {organizer.name}
            </span>
            {verified && <VerifiedBadge />}
          </div>
          {/* Follower count */}
          <span
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              display: 'block',
              marginTop: '2px',
            }}
          >
            {displayFollowerCount.toLocaleString()} follower{displayFollowerCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Stats row (when stats prop is provided) */}
      {stats && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-text)' }}>{stats.eventCount}</strong> events
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-text)' }}>{stats.totalTicketsSold.toLocaleString()}</strong> tickets sold
          </div>
        </div>
      )}

      {/* Upcoming events count (legacy prop path) */}
      {!stats && upcomingEventCount > 0 && (
        <div
          style={{
            fontSize: '13px',
            color: 'var(--color-text-muted)',
          }}
        >
          <strong style={{ color: 'var(--color-text)' }}>
            {upcomingEventCount}
          </strong>{' '}
          upcoming event{upcomingEventCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Follow button */}
      {onFollow && (
        <div style={{ width: '100%' }}>
          <Button
            variant={isFollowing ? 'ghost' : 'primary'}
            size="sm"
            onClick={handleFollowClick}
            fullWidth
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
