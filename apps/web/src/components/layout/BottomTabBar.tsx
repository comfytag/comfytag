'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAuthModal } from '@/hooks/useAuthModal'

export interface BottomTabBarProps {
  currentPath: string
}

interface Tab {
  label: string
  href: string
  icon: React.ReactNode
  ariaLabel: string
  protected?: boolean
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
    protected: true,
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
    protected: true,
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
  const { data: session } = useSession()
  const { openModal } = useAuthModal()

  return (
    <>
      <style>{`
        .__ct_bottom_tab_bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgb(228, 228, 231);
          padding: 8px 24px calc(8px + env(safe-area-inset-bottom));
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: calc(64px + env(safe-area-inset-bottom));
          gap: 0;
        }
        .__ct_bottom_tab_link {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 8px 0;
          text-decoration: none;
          color: #a1a1aa;
          font-size: 11px;
          font-weight: 500;
          transition: color 200ms ease;
          border: none;
          background: none;
          cursor: pointer;
          min-height: 60px;
          position: relative;
        }
        .__ct_bottom_tab_link.active {
          color: #7C3AED;
        }
        .__ct_bottom_tab_link:focus-visible {
          outline: 2px solid #7C3AED;
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
          const blocked = tab.protected && !session
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={blocked ? (e) => { e.preventDefault(); openModal('login') } : undefined}
              className={`__ct_bottom_tab_link ${active ? 'active' : ''}`}
              aria-label={tab.ariaLabel}
              aria-current={active ? 'page' : undefined}
            >
              <div
                suppressHydrationWarning
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 200ms ease',
                }}
              >
                {tab.icon}
              </div>
              <span style={{ fontWeight: active ? 700 : 500 }}>{tab.label}</span>
              {active && (
                <div
                  aria-hidden="true"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#7C3AED',
                    marginTop: 1,
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
