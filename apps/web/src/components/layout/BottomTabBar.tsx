'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface BottomTabBarProps {
  currentPath: string
}

interface Tab {
  label: string
  href: string
  icon: React.ReactNode
  ariaLabel: string
}

const TABS: Tab[] = [
  {
    label: 'Home',
    href: '/',
    ariaLabel: 'Home',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Explore',
    href: '/events',
    ariaLabel: 'Explore events',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    label: 'Tickets',
    href: '/tickets',
    ariaLabel: 'My tickets',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 7.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-12.5" />
        <path d="M13 5H6a2 2 0 0 0-2 2v7" />
        <path d="M18 5h7v12a2 2 0 0 1-2 2h-5" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    ariaLabel: 'Profile',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname.startsWith(href)
}

export function BottomTabBar({ currentPath }: BottomTabBarProps) {
  const pathname = usePathname()
  const path = currentPath || pathname

  return (
    <>
      <style>{`
        .__ct_bottom_tab_bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 30;
          background: var(--color-bg);
          border-top: 1px solid var(--color-border);
          padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: calc(80px + env(safe-area-inset-bottom));
          gap: 0;
        }
        .__ct_bottom_tab_link {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 0;
          text-decoration: none;
          color: var(--color-text-muted);
          font-size: 11px;
          font-weight: 500;
          transition: color var(--duration-micro) ease;
          border: none;
          background: none;
          cursor: pointer;
          min-height: 60px;
          position: relative;
        }
        .__ct_bottom_tab_link.active {
          color: var(--color-brand);
        }
        .__ct_bottom_tab_link.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 24px;
          background: var(--color-brand);
          border-radius: 0 0 3px 3px;
        }
        .__ct_bottom_tab_link:focus-visible {
          outline: 2px solid var(--color-brand);
          outline-offset: -2px;
        }
        @media (min-width: 768px) {
          .__ct_bottom_tab_bar {
            display: none;
          }
        }
      `}</style>

      <nav className="__ct_bottom_tab_bar" aria-label="Mobile navigation">
        {TABS.map((tab) => {
          const active = isActive(tab.href, path)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`__ct_bottom_tab_link ${active ? 'active' : ''}`}
              aria-label={tab.ariaLabel}
              aria-current={active ? 'page' : undefined}
            >
              <div suppressHydrationWarning style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
