'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@comfytag/types'
import { formatDate, formatTime } from '@comfytag/utils'

export interface PartnerEventCardProps {
  event: Event
  status?: 'draft' | 'live' | 'ended' | 'cancelled'
  compact?: boolean
  isTrending?: boolean
  isSoldOut?: boolean
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onViewPublic?: () => void
  href?: string
}

interface MenuItemProps {
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}

function MenuItem({ label, icon, onClick, danger = false }: MenuItemProps) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        background: hovered ? 'var(--color-surface-2)' : 'none',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        color: danger ? 'var(--color-error)' : 'var(--color-text)',
        fontSize: '13px',
        transition: 'background var(--duration-fast) ease',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function getStatusBadgeStyle(status: 'draft' | 'live' | 'ended' | 'cancelled'): React.CSSProperties {
  if (status === 'live') {
    return {
      background: 'var(--color-success)',
      color: 'var(--color-text-on-brand)',
    }
  }
  if (status === 'ended' || status === 'cancelled') {
    return {
      background: 'rgba(0,0,0,0.5)',
      color: 'var(--color-text-muted)',
    }
  }
  // draft
  return {
    background: 'rgba(255,255,255,0.15)',
    color: 'var(--color-text-muted)',
  }
}

export function EventCard({
  event,
  status,
  compact = false,
  isTrending = false,
  isSoldOut = false,
  onEdit,
  onDuplicate,
  onDelete,
  onArchive,
  onViewPublic,
  href,
}: PartnerEventCardProps) {
  const [hovered, setHovered] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Click-outside close
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const totalCap = (event.ticketType ?? []).reduce((s, t) => s + t.capacity, 0)
  const soldPct = totalCap > 0 ? event.sold / totalCap : 0
  const imageSrc = event.coverImage ?? event.images?.[0] ?? '/placeholder.svg'
  const height = compact ? 180 : 240

  const hasMenuActions =
    onEdit != null ||
    onDuplicate != null ||
    onDelete != null ||
    onArchive != null ||
    onViewPublic != null

  const cardContent = (
    <>
      <style>{`
        .__ct_partner_eventcard { text-decoration: none; display: block; }
        .__ct_partner_eventcard:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; border-radius: 16px; }
      `}</style>
      <div
        className="__ct_partner_eventcard"
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'block',
          height: `${height}px`,
          border: hovered ? '1px solid var(--color-brand)' : '1px solid transparent',
          transition: `border-color var(--duration-fast) ease`,
          cursor: 'default',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image — full-bleed */}
        <Image
          src={imageSrc}
          alt={event.name}
          fill
          style={{ objectFit: 'cover' }}
          sizes={compact ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 768px) 100vw, 50vw'}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          }}
        />

        {/* Status badge — top-left */}
        {status != null && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              ...getStatusBadgeStyle(status),
            }}
          >
            {status}
          </div>
        )}

        {/* FOMO pill — shifted down when status badge is also present */}
        {(isTrending || isSoldOut) && (
          <div
            style={{
              position: 'absolute',
              top: status != null ? '46px' : '12px',
              left: '12px',
              background: isSoldOut ? 'rgba(0,0,0,0.7)' : 'var(--color-energy)',
              color: isSoldOut ? 'var(--color-text-muted)' : 'var(--color-text)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {isSoldOut ? 'Sold Out' : 'Trending'}
          </div>
        )}

        {/* Three-dot manage menu — top-right */}
        {hasMenuActions && (
          <div ref={menuRef} style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <button
              type="button"
              aria-label="Manage event"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenuOpen((prev) => !prev)
              }}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-on-brand)',
              }}
            >
              {/* Three-dot SVG */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>

            {/* Popover menu */}
            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: '38px',
                  right: 0,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  minWidth: '160px',
                  zIndex: 10,
                  padding: '4px 0',
                }}
              >
                {onEdit != null && (
                  <MenuItem
                    label="Edit"
                    onClick={onEdit}
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    }
                  />
                )}
                {onDuplicate != null && (
                  <MenuItem
                    label="Duplicate"
                    onClick={onDuplicate}
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    }
                  />
                )}
                {onViewPublic != null && (
                  <MenuItem
                    label="View Public"
                    onClick={onViewPublic}
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    }
                  />
                )}
                {onArchive != null && (
                  <MenuItem
                    label="Archive"
                    onClick={onArchive}
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="21 8 21 21 3 21 3 8" />
                        <rect x="1" y="3" width="22" height="5" />
                        <line x1="10" y1="12" x2="14" y2="12" />
                      </svg>
                    }
                  />
                )}
                {onDelete != null && (
                  <MenuItem
                    label="Delete"
                    onClick={onDelete}
                    danger
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    }
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom content */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: compact ? '12px' : '16px',
          }}
        >
          {/* Event name */}
          <div
            style={{
              color: 'var(--color-text-on-brand)',
              fontSize: '17px',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '6px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {event.name}
          </div>

          {/* Date + venue */}
          <div
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '12px',
              lineHeight: 1.4,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <div>
              {formatDate(event.date)} at {formatTime(event.startTime)}
            </div>
            <div
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {event.venue}
            </div>
          </div>
        </div>

        {/* Capacity progress bar — bottom edge */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'var(--color-border)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(soldPct * 100, 100)}%`,
              background: 'var(--color-brand)',
              transition: 'width var(--duration-default) ease',
            }}
          />
        </div>
      </div>
    </>
  )

  if (href != null) {
    return <Link href={href}>{cardContent}</Link>
  }

  return cardContent
}
