'use client'

import { useState, useRef, useEffect, useContext } from 'react'
import Link from 'next/link'

import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { NotificationContext } from '@/contexts/NotificationContext'
import { usePartnerProfile } from '@/hooks/usePartner'

const NAV_LINKS = [
  { label: 'Studio',    href: '/overview' },
  { label: 'Events',    href: '/events' },
  { label: 'Attendees', href: '/attendees' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Payouts',   href: '/payouts' },
]

const DROPDOWN_ITEMS = [
  { label: 'KYC Verification', href: '/kyc' },
  { label: 'Ticket Tiers', href: '/tiers' },
  { label: 'Team', href: '/team' },
  { label: 'Onboarding', href: '/onboarding' },
  { label: 'Settings', href: '/settings' },
  { label: 'View Public Profile', href: '/profile' },
]

function isNavActive(href: string, pathname: string): boolean {
  if (href === '/overview') return pathname === '/overview'
  return pathname.startsWith(href)
}

export default function FloatingIslandNav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { unreadCount } = useContext(NotificationContext)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const { data: profile } = usePartnerProfile()
  const userInitial = session?.user?.name?.charAt(0).toUpperCase() ?? '?'
  const avatarSrc = profile?.image ?? session?.user?.logo ?? null

  return (
    <nav
      aria-label="Partner navigation"
      className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 items-center gap-1 bg-zinc-900/85 backdrop-blur-xl border border-white/10 rounded-full p-1.5 w-max"
    >
      {/* Logo */}
      <Link href="/overview" className="flex items-center shrink-0" aria-label="ComfyTag Studio home">
        {/* <span className="font-black text-white text-lg tracking-tight mr-2 pl-2">comfytag</span> */}
          <img alt="ComfyTag" className="w-auto h-8 object-contain" src="/logo.png" />
      </Link>

      {/* Primary nav links */}
      {NAV_LINKS.map(({ label, href }) => {
        const active = isNavActive(href, pathname)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={[
              'relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-full text-sm transition-colors duration-200',
              active
                ? 'text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200 font-medium',
            ].join(' ')}
          >
            {label}
            {active && (
              <span
                aria-hidden="true"
                className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-500"
              />
            )}
          </Link>
        )
      })}

      {/* Divider */}
      <div aria-hidden="true" className="w-px h-5 bg-white/10 mx-1 shrink-0" />

      {/* Notification bell */}
      <Link
        href="/notifications"
        aria-label={
          unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'
        }
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <svg
          width="18"
          height="18"
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
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-zinc-950"
          />
        )}
      </Link>

      {/* Avatar dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          aria-label="Account menu"
          className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 shrink-0"
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={session?.user?.name ?? 'Profile'}
              className="w-full h-full object-cover"
            />
          ) : (
            userInitial
          )}
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            className="absolute top-[calc(100%+8px)] right-0 min-w-[220px] bg-zinc-900 border border-white/10 rounded-lg py-2 z-[100] overflow-hidden"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-semibold text-zinc-50 leading-tight truncate">
                {session?.user?.name ?? 'Organizer'}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                {session?.user?.email ?? ''}
              </p>
            </div>

            {/* Nav items */}
            {DROPDOWN_ITEMS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors duration-150"
              >
                {label}
              </Link>
            ))}

            {/* Attendee view crosslink */}
            <a
              href={`${process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'}/handoff?t=${session?.user?.token ?? ''}`}
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
              className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors duration-150"
            >
              Attendee View →
            </a>

            {/* Sign out */}
            <div className="border-t border-white/10 mt-1 pt-1">
              <button
                role="menuitem"
                onClick={() => void signOut({ callbackUrl: '/login' })}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors duration-150"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
