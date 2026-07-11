'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useAuthModal } from '@/hooks/useAuthModal'

interface MobileMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/events' },
  { label: 'Tickets', href: '/tickets' },
  { label: 'Profile', href: '/profile' },
]

export function MobileMenuDrawer({ isOpen, onClose }: MobileMenuDrawerProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { openModal } = useAuthModal()

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  function isActive(href: string): boolean {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 400,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Drawer panel — slides in from right */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(300px, 88vw)',
          zIndex: 401,
          background: '#ffffff',
          borderLeft: '1px solid var(--color-border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 350ms cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Close button row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '18px 20px 0' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f4f4f5',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#71717a',
              flexShrink: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav aria-label="Drawer navigation" style={{ padding: '20px 24px 8px', display: 'flex', flexDirection: 'column' }}>
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                style={{
                  display: 'block',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: active ? '#7C3AED' : '#18181b',
                  textDecoration: 'none',
                  padding: '14px 0',
                  borderBottom: '1px solid #f4f4f5',
                  transition: 'color 150ms ease',
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Push auth to bottom */}
        <div style={{ flex: 1 }} />

        {/* Auth / account section */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            borderTop: '1px solid #f4f4f5',
          }}
        >
          {session?.user ? (
            <>
              {/* User identity */}
              <div style={{ marginBottom: '6px' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#18181b',
                    lineHeight: 1.3,
                  }}
                >
                  {session.user.name}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '13px',
                    color: '#71717a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {session.user.email}
                </p>
              </div>

              {/* Settings shortcut */}
              <Link
                href="/profile"
                onClick={onClose}
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#3f3f46',
                  textDecoration: 'none',
                  padding: '4px 0',
                  transition: 'color 150ms ease',
                }}
              >
                Settings
              </Link>

              {/* Log out */}
              <button
                type="button"
                onClick={() => { signOut({ callbackUrl: '/' }); onClose() }}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#ef4444',
                  background: '#fef2f2',
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  marginTop: '4px',
                  transition: 'background 150ms ease',
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              {/* Guest — Log In: light violet pill */}
              <button
                type="button"
                onClick={() => { openModal('login'); onClose() }}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#6D28D9',
                  background: '#EDE9FE',
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 150ms ease',
                }}
              >
                Log In
              </button>

              {/* Guest — Sign Up: solid premium */}
              <button
                type="button"
                onClick={() => { openModal('register'); onClose() }}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: '#7C3AED',
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 150ms ease',
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
