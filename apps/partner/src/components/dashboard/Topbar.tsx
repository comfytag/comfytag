'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Menu, Bell } from 'lucide-react'
import api, { authHeader } from '../../lib/api'

interface Notification {
  _id: string
  read: boolean
}

function getPageTitle(pathname: string): string {
  if (pathname === '/overview') return 'Overview'
  if (pathname === '/events/create') return 'Create Event'
  if (pathname.startsWith('/events')) return 'Events'
  if (pathname === '/notifications') return 'Notifications'
  if (pathname.startsWith('/settings/withdraw')) return 'Withdraw'
  if (pathname.startsWith('/settings')) return 'Settings'
  return 'Dashboard'
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', session?.user.id],
    queryFn: () =>
      api
        .get<{ notifications: Notification[]; total: number; unreadCount: number; page: number; hasMore: boolean }>('/notification', {
          params: { limit: 100 },
          ...authHeader(session?.user.token),
        })
        .then((r) => r.data.notifications),
    enabled: !!session?.user.id,
  })

  const unreadCount = (notificationsData ?? []).filter(n => !n.read).length

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const title = getPageTitle(pathname)
  const initials = getInitials(session?.user?.name)

  return (
    <header
      style={{
        height: 60,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <style>{`
        .topbar-hamburger { display: flex; }
        @media (min-width: 768px) { .topbar-hamburger { display: none; } }
        .topbar-title { margin-left: 12px; }
        @media (min-width: 768px) { .topbar-title { margin-left: 8px; } }
      `}</style>

      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          className="topbar-hamburger"
          onClick={onMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span
          className="topbar-title"
          style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)' }}
        >
          {title}
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => router.push('/notifications')}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Notifications"
        >
          <Bell size={20} style={{ color: 'var(--color-text-muted)' }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: 'var(--color-error)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-brand)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="User menu"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: 8,
                minWidth: 180,
                zIndex: 50,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: 'var(--color-text)',
                  padding: '8px 12px',
                }}
              >
                {session?.user?.name ?? '—'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  padding: '0 12px 8px',
                }}
              >
                {session?.user?.email ?? '—'}
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)' }} />
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  color: 'var(--color-error)',
                  fontSize: 14,
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: 6,
                  border: 'none',
                  transition: 'background 150ms',
                  marginTop: 4,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
