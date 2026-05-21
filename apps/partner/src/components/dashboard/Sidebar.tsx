'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Bell,
  Settings,
  Wallet,
  TrendingUp,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Overview',      href: '/overview',          icon: LayoutDashboard },
  { label: 'Analytics',     href: '/analytics',         icon: TrendingUp },
  { label: 'Events',        href: '/events',            icon: CalendarDays },
  { label: 'Create Event',  href: '/events/create',     icon: PlusCircle },
  { label: 'Notifications', href: '/notifications',     icon: Bell },
  { label: 'Settings',      href: '/settings',          icon: Settings },
  { label: 'Withdraw',      href: '/settings/withdraw', icon: Wallet },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <style>{`
        .sidebar-root {
          transform: translateX(-240px);
        }
        .sidebar-root.sidebar-open {
          transform: translateX(0);
        }
        @media (min-width: 768px) {
          .sidebar-root {
            transform: translateX(0) !important;
          }
          .sidebar-overlay {
            display: none !important;
          }
        }
      `}</style>

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 39,
          }}
        />
      )}

      <aside
        className={`sidebar-root${isOpen ? ' sidebar-open' : ''}`}
        style={{
          width: 240,
          minHeight: '100vh',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 40,
          transition: 'transform 200ms ease',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--color-brand)' }}>
            ComfyTag
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Partner Portal
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = href === '/settings' ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'background 150ms, color 150ms',
                  color: active ? 'var(--color-brand)' : 'var(--color-text-muted)',
                  background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'var(--color-surface-2)'
                    el.style.color = 'var(--color-text)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'transparent'
                    el.style.color = 'var(--color-text-muted)'
                  }
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              color: 'var(--color-text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 150ms, color 150ms',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = 'var(--color-error)'
              el.style.background = 'rgba(239,68,68,0.08)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.color = 'var(--color-text-muted)'
              el.style.background = 'transparent'
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
