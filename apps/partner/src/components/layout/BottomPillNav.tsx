'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab {
  label: string
  href: string
  ariaLabel: string
  icon: React.ReactNode
}

const TABS: Tab[] = [
  {
    label: 'Studio',
    href: '/overview',
    ariaLabel: 'Dashboard overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Events',
    href: '/events',
    ariaLabel: 'Your events',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/analytics',
    ariaLabel: 'Event analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="18" y="3" width="4" height="18" rx="1" />
        <rect x="10" y="8" width="4" height="13" rx="1" />
        <rect x="2" y="13" width="4" height="8" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Payouts',
    href: '/payouts',
    ariaLabel: 'Manage payouts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/overview') return pathname === '/overview'
  return pathname.startsWith(href)
}

export default function BottomPillNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Partner mobile navigation"
      className="md:hidden fixed left-4 right-4 z-50 backdrop-blur-xl bg-white/80 border border-zinc-200/60 p-2 rounded-full shadow-lg flex justify-around items-center"
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      {TABS.map(({ label, href, ariaLabel, icon }) => {
        const active = isActive(href, pathname)
        return (
          <Link
            key={href}
            href={href}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
            className={[
              'flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all duration-200 min-w-11 min-h-11 justify-center',
              active
                ? 'text-violet-600'
                : 'text-zinc-400 hover:text-zinc-500',
            ].join(' ')}
          >
            <span
              className={[
                'transition-transform duration-200',
                active ? 'scale-110' : 'scale-100',
              ].join(' ')}
            >
              {icon}
            </span>
            <span
              className={[
                'text-[10px] leading-none',
                active ? 'font-bold' : 'font-medium',
              ].join(' ')}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
