'use client'

import { useState, useRef, useEffect, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { NotificationContext } from '@/contexts/NotificationContext'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',  href: '/overview' },
  { label: 'Events',    href: '/events' },
  { label: 'Attendees', href: '/attendees' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Payouts',   href: '/payouts' },
]

export default function PartnerNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { unreadCount } = useContext(NotificationContext)
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Initialize real-time notification listener
  useNotificationSocket()

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() ?? '?'
  const avatarSrc = session?.user?.logo ?? null

  return (
    <>
      <style>{`
        .__ct_partner_nav {
          height: 64px;
          padding: 0 24px;
        }
        .__ct_partner_nav_links {
          display: flex;
        }
        @media (max-width: 767px) {
          .__ct_partner_nav {
            height: 56px;
            padding: 0 16px;
          }
          .__ct_partner_nav_links {
            display: none;
          }
        }
      `}</style>
      <nav
        className="__ct_partner_nav"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
      {/* Logo — left */}
      <Link
        href="/overview"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 700,
          fontSize: 18,
          color: 'var(--color-brand)',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          flexShrink: 0,
        }}
      >
        <Image alt="ComfyTag" className="w-auto h-8 object-contain" height={40} priority src="/logo.png" width={120} />
      </Link>

      {/* Center nav links */}
      <div
        className="__ct_partner_nav_links"
        style={{
          alignItems: 'center',
          gap: 4,
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? 'var(--color-brand)' : 'var(--color-text-muted)',
                textDecoration: 'none',
                borderBottom: isActive
                  ? '2px solid var(--color-brand)'
                  : '2px solid transparent',
                transition: `color var(--duration-fast) ease, border-color var(--duration-fast) ease`,
                height: 64,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Right — Bell + Avatar */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Bell notification */}
        <Link
          href="/notifications"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : 'Notifications'
          }
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            transition: `color var(--duration-fast) ease`,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-error)',
                border: '2px solid var(--color-bg)',
              }}
            />
          )}
        </Link>

        {/* Avatar dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            aria-label="Account menu"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: avatarSrc ? 'transparent' : 'var(--color-brand)',
              color: 'var(--color-text-on-brand)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={session?.user?.name ?? 'Profile'}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              userInitial
            )}
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: 220,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '8px 0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                zIndex: 100,
              }}
            >
              {/* User info */}
              <div
                style={{
                  padding: '12px 16px 10px',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    lineHeight: 1.4,
                  }}
                >
                  {session?.user?.name ?? 'Organizer'}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}
                >
                  {session?.user?.email ?? ''}
                </p>
              </div>

              {/* Divider */}
              <div style={{ borderBottom: '1px solid var(--color-border)' }} />

              {/* KYC link */}
              <Link
                href="/kyc"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  fontSize: 14,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  transition: `background var(--duration-fast) ease`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'var(--color-border)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'transparent'
                }}
              >
                KYC Verification
              </Link>

              {/* Tiers link */}
              <Link
                href="/tiers"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  fontSize: 14,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  transition: `background var(--duration-fast) ease`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'var(--color-border)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'transparent'
                }}
              >
                Ticket Tiers
              </Link>

              {/* Team link */}
              <Link
                href="/team"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  fontSize: 14,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  transition: `background var(--duration-fast) ease`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'var(--color-border)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'transparent'
                }}
              >
                Team
              </Link>

              {/* Onboarding link */}
              <Link
                href="/onboarding"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  fontSize: 14,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  transition: `background var(--duration-fast) ease`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'var(--color-border)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'transparent'
                }}
              >
                Onboarding
              </Link>

              {/* Settings link */}
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  fontSize: 14,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  transition: `background var(--duration-fast) ease`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'var(--color-border)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'transparent'
                }}
              >
                Settings
              </Link>

              {/* Menu items */}
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  fontSize: 14,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  transition: `background var(--duration-fast) ease`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'var(--color-border)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'transparent'
                }}
              >
                View Public Profile
              </Link>

              {/* Attendee View link */}
              <a
                href={`https://comfytag.com/handoff?t=${session?.user?.token}`}
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  fontSize: 14,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  transition: `background var(--duration-fast) ease`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'var(--color-border)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background =
                    'transparent'
                }}
              >
                Attendee View →
              </a>

              {/* Divider */}
              <div style={{ borderBottom: '1px solid var(--color-border)' }} />

              <button
                role="menuitem"
                onClick={() => void signOut({ callbackUrl: '/login' })}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: 14,
                  color: 'var(--color-error)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: `background var(--duration-fast) ease`,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    'var(--color-border)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    'transparent'
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      </nav>
    </>
  )
}