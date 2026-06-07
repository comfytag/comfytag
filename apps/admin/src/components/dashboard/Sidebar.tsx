'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  FileCheck,
  Banknote,
  ScanFace,
  TrendingUp,
  BarChart3,
  ClipboardList,
  UserCog,
  Settings,
  LogOut,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import type { AdminRole } from '../../lib/roles'
import { hasRole } from '../../lib/roleGuard'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: AdminRole[] | 'all'
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard, roles: 'all' },
  { label: 'Users', href: '/users', icon: Users, roles: ['super_admin', 'moderator'] },
  { label: 'Organizers', href: '/organizers', icon: Building2, roles: ['super_admin', 'moderator'] },
  { label: 'Events', href: '/events', icon: Calendar, roles: 'all' },
  { label: 'KYC', href: '/kyc', icon: FileCheck, roles: ['super_admin', 'moderator'] },
  { label: 'Payouts', href: '/payouts', icon: Banknote, roles: ['super_admin', 'finance'] },
  { label: 'Face Logs', href: '/face-logs', icon: ScanFace, roles: ['super_admin', 'moderator'] },
  { label: 'Promoted', href: '/promoted', icon: TrendingUp, roles: 'all' },
  { label: 'Categories', href: '/categories', icon: Tag, roles: 'all' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['super_admin', 'finance'] },
  { label: 'Audit Log', href: '/audit', icon: ClipboardList, roles: ['super_admin'] },
  { label: 'Team', href: '/team', icon: UserCog, roles: ['super_admin'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: 'all' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  role: AdminRole
}

export function Sidebar({ isOpen, onClose, role }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles === 'all' ? true : hasRole(role, item.roles)
  )

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .ct-sidebar { transform: translateX(-100%); }
          .ct-sidebar.ct-sidebar--open { transform: translateX(0); }
          .ct-sidebar-backdrop { display: block; }
        }
        @media (min-width: 769px) {
          .ct-sidebar { transform: translateX(0) !important; }
          .ct-sidebar-backdrop { display: none !important; }
        }
      `}</style>

      {isOpen && (
        <div
          className="ct-sidebar-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 39,
            display: 'none',
          }}
        />
      )}

      <aside
        className={`ct-sidebar${isOpen ? ' ct-sidebar--open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '240px',
          height: '100vh',
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          transition: 'transform 0.2s ease',
        }}
      >
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Image src="/logo.svg" alt="ComfyTag" width={24} height={24} style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand)' }}>
              ComfyTag
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
              Admin
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <NavLink key={item.href} href={item.href} isActive={isActive}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <SignOutButton />
        </div>
      </aside>
    </>
  )
}

function NavLink({
  href,
  isActive,
  children,
}: {
  href: string
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 12px',
        borderRadius: '8px',
        marginBottom: '2px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--color-brand)' : 'var(--color-text)',
        backgroundColor: isActive
          ? 'color-mix(in srgb, var(--color-brand) 15%, transparent)'
          : 'transparent',
        borderLeft: isActive
          ? '3px solid var(--color-brand)'
          : '3px solid transparent',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'var(--color-surface-2)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
        }
      }}
    >
      {children}
    </Link>
  )
}

function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '9px 12px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'transparent',
        color: 'var(--color-text-muted)',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-error)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'
      }}
    >
      <LogOut size={18} />
      Sign out
    </button>
  )
}
