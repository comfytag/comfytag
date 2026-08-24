'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { usePartnerProfile } from '@/hooks/usePartner'

interface NavTab {
  label: string
  href: string
  ariaLabel: string
  icon: React.ReactNode
}

const TABS: NavTab[] = [
  {
    label: 'Overview',
    href: '/overview',
    ariaLabel: 'Dashboard overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Events',
    href: '/events',
    ariaLabel: 'Your events',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Attendees',
    href: '/attendees',
    ariaLabel: 'Event attendees',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Payouts',
    href: '/payouts',
    ariaLabel: 'Manage payouts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
]

const MENU_ITEMS = [
  { label: 'Analytics', href: '/analytics' },
  { label: 'Team',      href: '/team' },
  { label: 'Settings',  href: '/settings' },
]

const TAB_BASE =
  'flex flex-col items-center gap-0.5 px-3 py-2 rounded-full transition-all duration-200 min-w-10 min-h-11 justify-center'

function isActive(href: string, pathname: string): boolean {
  if (href === '/overview') return pathname === '/overview'
  return pathname.startsWith(href)
}

export default function BottomPillNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: profile } = usePartnerProfile()
  const userInitial = session?.user?.name?.charAt(0).toUpperCase() ?? '?'
  const avatarSrc = profile?.image ?? session?.user?.logo ?? null

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <nav
      aria-label="Partner mobile navigation"
      className="md:hidden fixed left-4 right-4 z-50 bg-(--color-surface) border border-(--color-border) p-2 rounded-full flex justify-around items-center"
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      {/* Standard link tabs */}
      {TABS.map(({ label, href, ariaLabel, icon }) => {
        const active = isActive(href, pathname)
        return (
          <Link
            key={href}
            href={href}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
            className={[
              TAB_BASE,
              active ? 'text-(--color-brand)' : 'text-(--color-text-muted) hover:text-(--color-text)',
            ].join(' ')}
          >
            <span
              className={
                active
                  ? 'scale-110 transition-transform duration-200'
                  : 'scale-100 transition-transform duration-200'
              }
            >
              {icon}
            </span>
            <span
              className={[
                'text-[10px] leading-none',
                active ? 'font-bold' : 'font-medium',
              ].join(' ')}
            >
              {label}
            </span>
          </Link>
        )
      })}

      {/* 5th item — avatar/more dropdown */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          aria-label="More options"
          className={[
            TAB_BASE,
            menuOpen ? 'text-violet-600' : 'text-zinc-400 hover:text-zinc-500',
          ].join(' ')}
        >
          <span
            className={
              menuOpen
                ? 'scale-110 transition-transform duration-200'
                : 'scale-100 transition-transform duration-200'
            }
          >
            <span className="w-5 h-5 rounded-full bg-(--color-brand) text-white text-[9px] font-bold flex items-center justify-center overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                userInitial
              )}
            </span>
          </span>
          <span
            className={[
              'text-[10px] leading-none',
              menuOpen ? 'font-bold' : 'font-medium',
            ].join(' ')}
          >
            More
          </span>
        </button>

        {/* Upward dropdown */}
        {menuOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-48 bg-(--color-surface) border border-(--color-border) rounded-lg overflow-hidden z-[60]">
            {MENU_ITEMS.map(({ label, href }, i) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={[
                  'block px-4 py-3 text-sm text-(--color-text) hover:bg-(--color-bg) transition-colors',
                  i > 0 ? 'border-t border-(--color-border)' : '',
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
            <div className="border-t border-(--color-border)">
              <button
                onClick={() => void signOut({ callbackUrl: '/login' })}
                className="w-full text-left px-4 py-3 text-sm text-(--color-error) hover:bg-(--color-bg) transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
