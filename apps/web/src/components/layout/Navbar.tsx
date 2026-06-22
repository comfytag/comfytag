'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { SearchInput } from '@/components/ui/SearchInput'
import { SearchSuggestionsOverlay } from '@/components/ui/SearchSuggestionsOverlay'

import { AvatarInitials, LoadingSpinner } from '@comfytag/ui'
import { authHeader, formatNaira } from '@comfytag/utils'
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
  const [searchVal, setSearchVal] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
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

  // Fetch wallet balance when dropdown opens
  useEffect(() => {
    if (!dropdownOpen || !session) return
    api
      .get('/wallet')
      .then((r) => {
        const bal = r.data?.data?.balance ?? r.data?.balance ?? null
        setWalletBalance(typeof bal === 'number' ? bal : null)
      })
      .catch(() => {})
  }, [dropdownOpen, session])

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
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 16px;
        }
        .__ct_nav_search {
          flex: 1;
          max-width: 480px;
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
            background: rgba(255, 255, 255, 0.80);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom-color: rgba(228, 228, 231, 0.50);
          }
          .__ct_nav_search {
            display: none;
          }
          .__ct_nav_mobile_search_btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          /* Avatar dropdown handled by Profile tab in bottom nav */
          .__ct_nav_avatar_wrap { display: none; }
        }
      `}</style>
      <nav className="__ct_navbar" aria-label="Main navigation">
        {/* Logo — left-aligned on both desktop and mobile */}
        <Link href="/" className="__ct_nav_logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img alt="ComfyTag" className="w-auto h-8 object-contain" src="/logo.png" />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Bell + notification panel */}
            <div ref={notifRef} style={{ position: 'relative' }}>
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
                  boxShadow: 'var(--shadow-lg)',
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

            {/* Avatar + dropdown — hidden on mobile (lives in MobileMenuDrawer) */}
            <div ref={dropdownRef} className="__ct_nav_avatar_wrap" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
                style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
              >
                <AvatarInitials name={currentUser.name ?? currentUser.email} size={36} fontSize={13} />
              </button>

              {dropdownOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', minWidth: '210px', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</div>
                    {/* {walletBalance !== null && (
                      <div style={{ fontSize: '12px', color: 'var(--color-brand)', marginTop: '4px', fontWeight: 600 }}>
                        Hype Credits: {formatNaira(walletBalance)}
                      </div>
                    )} */}
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
            <button
              type="button"
              onClick={() => openModal('login')}
              className="__ct_nav_login_link"
              style={{ fontSize: '14px', fontWeight: 500, padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => openModal('register')}
              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-on-brand)', background: 'var(--color-brand)', borderRadius: 'var(--radius-md)', padding: '8px 16px', border: 'none', cursor: 'pointer' }}
            >
              Sign Up
            </button>
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
