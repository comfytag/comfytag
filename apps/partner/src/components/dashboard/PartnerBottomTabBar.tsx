'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface PartnerBottomTabBarProps {
  currentPath?: string
}

interface Tab {
  label: string
  href: string
  icon: React.ReactNode
  ariaLabel: string
}

const TABS: Tab[] = [
  {
    label: 'Overview',
    href: '/overview',
    ariaLabel: 'Dashboard overview',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Events',
    href: '/events',
    ariaLabel: 'Your events',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/analytics',
    ariaLabel: 'Event analytics',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="18" y="3" width="4" height="18" />
        <rect x="10" y="8" width="4" height="13" />
        <rect x="2" y="13" width="4" height="8" />
      </svg>
    ),
  },
  {
    label: 'Payouts',
    href: '/payouts',
    ariaLabel: 'Manage payouts',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/overview') {
    return pathname === '/overview'
  }
  return pathname.startsWith(href)
}

export function PartnerBottomTabBar({ currentPath }: PartnerBottomTabBarProps) {
  const pathname = usePathname()
  const path = currentPath || pathname

  return (
    <>
      <style>{`
        .__ct_partner_tabbar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 30;
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: calc(80px + env(safe-area-inset-bottom));
          gap: 0;
        }
        .__ct_partner_tab_link {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 0;
          text-decoration: none;
          color: var(--color-text-secondary);
          font-size: 11px;
          font-weight: 500;
          transition: color var(--duration-micro) ease;
          border: none;
          background: none;
          cursor: pointer;
          min-height: 60px;
        }
        .__ct_partner_tab_link.active {
          color: var(--color-brand);
        }
        .__ct_partner_tab_link:focus-visible {
          outline: 2px solid var(--color-brand);
          outline-offset: -2px;
        }
        @media (min-width: 768px) {
          .__ct_partner_tabbar {
            display: none;
          }
        }
      `}</style>

      <nav className="__ct_partner_tabbar" aria-label="Partner navigation">
        {TABS.map((tab) => {
          const active = isActive(tab.href, path)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`__ct_partner_tab_link ${active ? 'active' : ''}`}
              aria-label={tab.ariaLabel}
              aria-current={active ? 'page' : undefined}
            >
              <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {tab.icon}
              </div>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
