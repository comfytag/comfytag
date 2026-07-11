'use client'

import { useState } from 'react'
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
  Globe,
  Megaphone,
  Image as ImageIcon,
  HelpCircle,
  Layers,
  ChevronDown,
  MessageSquare,
  Scale,
  LayoutTemplate,
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
  { label: 'Overview',        href: '/overview',   icon: LayoutDashboard, roles: 'all' },
  { label: 'User Management', href: '/users',       icon: Users,           roles: ['support', 'moderator', 'finance'] },
  { label: 'Organizers',      href: '/organizers',  icon: Building2,       roles: ['support', 'moderator', 'finance'] },
  { label: 'KYC Review',      href: '/kyc',         icon: FileCheck,       roles: ['kyc_reviewer', 'finance', 'support'] },
  { label: 'Events',          href: '/events',      icon: Calendar,        roles: 'all' },
  { label: 'Payouts',         href: '/payouts',     icon: Banknote,        roles: ['finance', 'support'] },
  { label: 'Promoted',        href: '/promoted',    icon: TrendingUp,      roles: 'all' },
  { label: 'Categories',      href: '/categories',  icon: Tag,             roles: 'all' },
  { label: 'Face Logs',       href: '/face-logs',   icon: ScanFace,        roles: ['moderator', 'support'] },
  { label: 'Analytics',       href: '/analytics',   icon: BarChart3,       roles: ['finance', 'support', 'moderator'] },
  { label: 'Audit Log',       href: '/audit',       icon: ClipboardList,   roles: ['super_admin'] },
  { label: 'Team',            href: '/team',        icon: UserCog,         roles: ['super_admin'] },
  { label: 'Settings',        href: '/settings',    icon: Settings,        roles: 'all' },
]

const CMS_NAV_ITEMS: NavItem[] = [
  { label: 'Settings',      href: '/cms/settings',      icon: Globe,           roles: ['super_admin'] },
  { label: 'Marquee Strip', href: '/cms/marquee',       icon: Megaphone,       roles: ['super_admin', 'moderator'] },
  { label: 'Banners',       href: '/cms/banners',       icon: ImageIcon,       roles: ['super_admin', 'moderator'] },
  { label: 'How It Works',  href: '/cms/how-it-works',  icon: HelpCircle,      roles: ['super_admin', 'moderator'] },
  { label: 'Curated',       href: '/cms/curated',       icon: Layers,          roles: ['super_admin', 'moderator'] },
  { label: 'FAQs',          href: '/cms/faqs',          icon: MessageSquare,   roles: ['super_admin', 'moderator'] },
  { label: 'Legal',         href: '/cms/legal',         icon: Scale,           roles: ['super_admin'] },
  { label: 'Pages',         href: '/cms/pages',         icon: LayoutTemplate,  roles: ['super_admin'] },
]

// Insertion index: CMS group goes after Categories (index 7)
const CMS_INSERT_AFTER_INDEX = 7

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  role: AdminRole
}

export function Sidebar({ isOpen, onClose, role }: SidebarProps) {
  const pathname = usePathname()
  const isCmsActive = pathname.startsWith('/cms/')
  const [cmsOpen, setCmsOpen] = useState(isCmsActive)

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles === 'all' ? true : hasRole(role, item.roles)
  )

  const visibleCmsItems = CMS_NAV_ITEMS.filter((item) =>
    item.roles === 'all' ? true : hasRole(role, item.roles)
  )

  const beforeCms = visibleItems.slice(0, CMS_INSERT_AFTER_INDEX + 1)
  const afterCms  = visibleItems.slice(CMS_INSERT_AFTER_INDEX + 1)

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
          <Image alt="ComfyTag" className="w-auto h-8 object-contain" height={40} priority src="/logo.png" width={120} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Admin
          </span>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {beforeCms.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <NavLink key={item.href} href={item.href} isActive={isActive}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}

          {visibleCmsItems.length > 0 && (
            <CmsNavGroup
              items={visibleCmsItems}
              isOpen={cmsOpen}
              onToggle={() => setCmsOpen((v) => !v)}
              pathname={pathname}
            />
          )}

          {afterCms.map((item) => {
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

function CmsNavGroup({
  items,
  isOpen,
  onToggle,
  pathname,
}: {
  items: NavItem[]
  isOpen: boolean
  onToggle: () => void
  pathname: string
}) {
  const hasActive = items.some((item) => pathname.startsWith(item.href))

  return (
    <div style={{ marginBottom: '2px' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '9px 12px',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          backgroundColor: hasActive
            ? 'color-mix(in srgb, var(--color-brand) 10%, transparent)'
            : 'transparent',
          borderLeft: hasActive
            ? '3px solid var(--color-brand)'
            : '3px solid transparent',
          color: hasActive ? 'var(--color-brand)' : 'var(--color-text)',
          fontSize: '14px',
          fontWeight: hasActive ? 600 : 400,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!hasActive) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-2)'
          }
        }}
        onMouseLeave={(e) => {
          if (!hasActive) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }
        }}
      >
        <Globe size={18} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Content</span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            paddingLeft: '12px',
            paddingBottom: '4px',
            marginTop: '2px',
            borderLeft: '1px solid var(--color-border)',
            marginLeft: '20px',
          }}
        >
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <NavLink key={item.href} href={item.href} isActive={isActive}>
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
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
        borderRadius: 'var(--radius-lg)',
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
        borderRadius: 'var(--radius-lg)',
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
