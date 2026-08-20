'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { SearchInput } from '@/components/ui/SearchInput'
import { SearchSuggestionsOverlay } from '@/components/ui/SearchSuggestionsOverlay'

import { AvatarInitials, LoadingSpinner } from '@comfytag/ui'
import { authHeader } from '@comfytag/utils'
import type { Notification, User } from '@comfytag/types'
import { api } from '@/lib/api'
import { useAuthModal } from '@/hooks/useAuthModal'

export interface NavbarProps {
  user?: User
  onSearch?: (query: string) => void
}

export function Navbar({ user, onSearch }: NavbarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [searchVal, setSearchVal] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const currentUser = user || session?.user
  const { openModal } = useAuthModal()

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // Close notification panel on outside click
  useEffect(() => {
    if (!notifOpen) return
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  // Prefetch unread count on session load so dot shows on cold load
  useEffect(() => {
    if (!session?.user?.token) return
    api
      .get('/notification?page=1&limit=5')
      .then((r) => {
        const list = Array.isArray(r.data)
          ? r.data
          : (r.data?.data ?? r.data?.notifications ?? [])
        setNotifs(list as Notification[])
      })
      .catch(() => {})
  }, [session])

  // Refresh notifications when panel opens
  useEffect(() => {
    if (!notifOpen || !session?.user?.token) return
    setNotifLoading(true)
    api
      .get('/notification?page=1&limit=5')
      .then((r) => {
        const list = Array.isArray(r.data)
          ? r.data
          : (r.data?.data ?? r.data?.notifications ?? [])
        setNotifs(list as Notification[])
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false))
  }, [notifOpen, session])

  // Escape key closes mobile search overlay
  useEffect(() => {
    if (!mobileSearchOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setMobileSearchOpen(false)
      setSearchVal('')
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileSearchOpen])

  function closeMobileSearch() {
    setMobileSearchOpen(false)
    setSearchVal('')
  }

  function handleSearch(q?: string) {
    const query = (q ?? searchVal).trim()
    if (query) {
      if (onSearch) {
        onSearch(query)
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}`)
      }
    }
  }

  return (
    <>
      <style>{`
        .__ct_navbar {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-border);
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 24px;
        }
        .__ct_nav_search {
          width: 384px;
        }
        .__ct_nav_links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .__ct_nav_link {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--duration-micro) ease;
          white-space: nowrap;
        }
        .__ct_nav_link:hover {
          color: var(--color-brand);
        }
        .__ct_nav_link.active {
          color: var(--color-brand);
          font-weight: 700;
        }
        .__ct_nav_wallet_btn {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: color var(--duration-micro) ease, background var(--duration-micro) ease;
          flex-shrink: 0;
        }
        .__ct_nav_wallet_btn:hover {
          color: var(--color-text);
          background: var(--color-surface-2);
        }
        .__ct_nav_mobile_profile_btn {
          display: none;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          background: none;
          color: var(--color-text-muted);
          transition: color var(--duration-micro) ease, background var(--duration-micro) ease;
          flex-shrink: 0;
        }
        .__ct_nav_mobile_profile_btn:hover {
          color: var(--color-text);
          background: var(--color-surface-2);
        }
        @media (max-width: 767px) {
          .__ct_nav_links { display: none; }
        }
        .__ct_nav_drop_item {
          display: block;
          padding: 10px 16px;
          font-size: 14px;
          color: var(--color-text);
          text-decoration: none;
          transition: background var(--duration-micro) ease;
        }
        .__ct_nav_drop_item:hover {
          background: var(--color-surface-2);
        }
        .__ct_nav_drop_item:focus-visible {
          outline: 2px solid var(--color-brand);
          outline-offset: -2px;
        }
        .__ct_nav_login_link {
          color: var(--color-text-muted);
          transition: color var(--duration-micro) ease;
        }
        .__ct_nav_login_link:hover {
          color: var(--color-text);
        }
        .__ct_nav_mobile_search_btn {
          display: none;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: color var(--duration-micro) ease;
          padding: 0;
          flex-shrink: 0;
        }
        .__ct_nav_mobile_search_btn:hover {
          color: var(--color-text);
        }
        .__ct_nav_mobile_search_btn:focus-visible {
          outline: 2px solid var(--color-brand);
          outline-offset: 2px;
        }
        @media (max-width: 767px) {
          .__ct_navbar {
            height: 56px;
            padding: 0 16px;
            background: var(--color-bg);
            border-bottom-color: var(--color-border);
          }
          .__ct_nav_search {
            display: none;
          }
          .__ct_nav_mobile_search_btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          /* Mobile keeps only Search + Profile — wallet and notifications drop off */
          .__ct_nav_wallet_btn { display: none; }
          .__ct_nav_bell_wrap { display: none; }
          .__ct_nav_mobile_profile_btn { display: flex; }
          /* Avatar dropdown handled by Profile tab in bottom nav */
          .__ct_nav_avatar_wrap { display: none; }
        }
      `}</style>
      <nav className="__ct_navbar" aria-label="Main navigation">
        {/* Logo — left-aligned on both desktop and mobile */}
        <Link href="/" className="__ct_nav_logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-brand)', letterSpacing: '-0.01em' }}>ComfyTag</span>
        </Link>

        {/* Search — desktop only */}
        <div className="__ct_nav_search" style={{ position: 'relative' }}>
          <SearchInput
            value={searchVal}
            onChange={setSearchVal}
            onSearch={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search events, artists, venues…"
          />
          <SearchSuggestionsOverlay
            query={searchVal}
            isOpen={searchFocused}
            onClose={() => { setSearchFocused(false); setSearchVal('') }}
          />
        </div>

        <div style={{ flex: 1 }} />

        {/* Primary nav links — desktop only */}
        <nav className="__ct_nav_links" aria-label="Primary">
          <Link href="/events" className={`__ct_nav_link ${pathname?.startsWith('/events') ? 'active' : ''}`}>Events</Link>
          <Link href="/about" className={`__ct_nav_link ${pathname === '/about' ? 'active' : ''}`}>About</Link>
          <Link href="/contact" className={`__ct_nav_link ${pathname === '/contact' ? 'active' : ''}`}>Help</Link>
        </nav>

        {/* Mobile search button */}
        <button
          type="button"
          className="__ct_nav_mobile_search_btn"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Search events"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>

        {/* Right side */}
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Ticket wallet */}
            <Link
              href="/tickets"
              className="__ct_nav_wallet_btn"
              aria-label="Ticket Wallet"
              title="Ticket Wallet"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </Link>

            {/* Bell + notification panel — desktop only, replaced by a Profile icon on mobile */}
            <div ref={notifRef} className="__ct_nav_bell_wrap" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
                style={{
                  position: 'relative',
                  width: 38,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-full)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  transition: 'color var(--duration-micro) ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notifs.some((n) => !n.read) && (
                  <span
                    style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-error)', border: '2px solid var(--color-bg)' }}
                    aria-hidden="true"
                  />
                )}
              </button>

              <div
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: 320,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  zIndex: 200,
                  overflow: 'hidden',
                  opacity: notifOpen ? 1 : 0,
                  transform: notifOpen ? 'translateY(0)' : 'translateY(-8px)',
                  pointerEvents: notifOpen ? 'auto' : 'none',
                  transition: 'opacity 200ms ease, transform 200ms ease',
                }}
              >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Notifications</span>
                    <Link href="/notifications" onClick={() => setNotifOpen(false)} style={{ fontSize: 12, color: 'var(--color-brand)', textDecoration: 'none' }}>See all</Link>
                  </div>
                  {notifLoading ? (
                    <div style={{ padding: 16, textAlign: 'center' }}><LoadingSpinner size="sm" /></div>
                  ) : notifs.length === 0 ? (
                    <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>No notifications yet</div>
                  ) : (
                    notifs.map((n) => (
                      <div key={n._id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: n.read ? 'transparent' : 'color-mix(in srgb, var(--color-brand) 4%, transparent)' }}>
                        <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 700, color: 'var(--color-text)', margin: '0 0 2px', lineHeight: 1.4 }}>{n.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

            </div>

            {/* Profile avatar — mobile only, same avatar image as desktop, replaces the bell + wallet */}
            <Link href="/profile" className="__ct_nav_mobile_profile_btn" aria-label="Profile">
              <AvatarInitials name={currentUser.name ?? currentUser.email} src={currentUser.image ?? undefined} size={32} fontSize={13} />
            </Link>

            {/* Avatar + dropdown — hidden on mobile (Profile tab in BottomTabBar covers account access there) */}
            <div ref={dropdownRef} className="__ct_nav_avatar_wrap" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', background: 'none', border: '2px solid var(--color-brand-light)', cursor: 'pointer', padding: 0, flexShrink: 0, overflow: 'hidden' }}
              >
                <AvatarInitials name={currentUser.name ?? currentUser.email} src={currentUser.image ?? undefined} size={36} fontSize={13} />
              </button>

              {dropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', minWidth: '210px', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</div>
                  </div>
                  <Link href="/tickets" className="__ct_nav_drop_item" onClick={() => setDropdownOpen(false)}>My Tickets</Link>
                  <Link href="/my-following" className="__ct_nav_drop_item" onClick={() => setDropdownOpen(false)}>Saved Events</Link>
                  {/* MVP: Hype Links affiliate feature disabled for initial launch — re-enable when affiliate system is ready */}
                  {/* <Link href="/hype-link" className="__ct_nav_drop_item" onClick={() => setDropdownOpen(false)}>My Hype Link</Link> */}
                  <Link href="/profile" className="__ct_nav_drop_item" onClick={() => setDropdownOpen(false)}>Settings</Link>
                  <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="__ct_nav_auth_wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/login"
              onClick={(e) => { e.preventDefault(); openModal('login') }}
              className="__ct_nav_login_link"
              style={{ fontSize: '14px', fontWeight: 500, padding: '6px 10px', textDecoration: 'none', display: 'inline-block' }}
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={(e) => { e.preventDefault(); openModal('register') }}
              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-on-brand)', background: 'var(--color-brand)', borderRadius: 'var(--radius-md)', padding: '8px 16px', textDecoration: 'none', display: 'inline-block' }}
            >
              Sign Up
            </Link>
          </div>
        )}
      </nav>

      {/* Mobile search overlay — same autocomplete as desktop */}
      {mobileSearchOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={closeMobileSearch}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 98,
            }}
          />

          {/* Panel */}
          <div
            role="search"
            aria-label="Search"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 99,
              background: 'var(--color-bg)',
              borderBottom: '1px solid var(--color-border)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {/* Back button */}
            <button
              type="button"
              onClick={closeMobileSearch}
              aria-label="Close search"
              style={{
                flexShrink: 0,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>

            {/* Input + suggestions (position:relative so suggestions anchor to input) */}
            <div style={{ flex: 1, position: 'relative' }}>
              <SearchInput
                value={searchVal}
                onChange={setSearchVal}
                onSearch={(q) => { handleSearch(q); closeMobileSearch() }}
                autoFocus
                placeholder="Search events, artists, venues…"
              />
              <SearchSuggestionsOverlay
                query={searchVal}
                isOpen={true}
                onClose={closeMobileSearch}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
