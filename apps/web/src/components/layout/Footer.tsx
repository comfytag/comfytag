import Link from 'next/link'
import { Smartphone, Globe2 } from 'lucide-react'

const SOCIAL_LINKS = [
  {
    label: 'Twitter / X',
    href: 'https://x.com/comfytag',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/comfytag',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/comfytag',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
]

const APP_LINKS = [
  { label: 'Find Events', href: '/events' },
  { label: 'Tickets', href: '/tickets' },
  { label: 'How it Works', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const PARTNER_LINKS = [
  { label: 'Partner Suite', href: process.env.NEXT_PUBLIC_PARTNER_URL ?? 'http://localhost:3001' },
  { label: 'About', href: '/about' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-(--color-surface-2) pt-20 pb-10 [padding-bottom:calc(2.5rem+64px+env(safe-area-inset-bottom))] md:pb-10" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-4 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-(--color-border) pb-16">
          <div className="md:col-span-4">
            <span className="text-xl font-bold text-brand mb-6 block">ComfyTag</span>
            <p className="text-(--color-text-muted) max-w-xs mb-8">
              Nigeria&apos;s face-powered event ticketing platform — seamless biometric entry, no codes, no paper.
            </p>
            <div className="flex gap-3" role="list" aria-label="Social links">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  role="listitem"
                  className="w-10 h-10 rounded-full bg-(--color-surface) flex items-center justify-center text-(--color-text-muted) hover:bg-brand hover:text-white transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <h5 className="font-bold text-(--color-text) mb-6">App</h5>
            <ul className="space-y-4 text-(--color-text-muted) text-sm">
              {APP_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-brand transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h5 className="font-bold text-(--color-text) mb-6">Partners</h5>
            <ul className="space-y-4 text-(--color-text-muted) text-sm">
              {PARTNER_LINKS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-brand transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h5 className="font-bold text-(--color-text) mb-6">Get the App</h5>
            <div className="flex flex-col gap-3 max-w-[220px]">
              <div className="flex items-center gap-3 px-5 py-3 bg-(--color-text) text-(--color-bg) rounded-xl opacity-70">
                <Smartphone className="w-6 h-6" aria-hidden="true" />
                <div className="text-left">
                  <p className="text-[10px] uppercase leading-none opacity-70">Coming soon on</p>
                  <p className="text-sm font-bold">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-(--color-text) text-(--color-bg) rounded-xl opacity-70">
                <Globe2 className="w-6 h-6" aria-hidden="true" />
                <div className="text-left">
                  <p className="text-[10px] uppercase leading-none opacity-70">Coming soon on</p>
                  <p className="text-sm font-bold">Google Play</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-(--color-text-muted) text-xs">
          <p>© {currentYear} ComfyTag Inc. All rights reserved.</p>
          <div className="flex gap-8">
            {LEGAL_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-brand transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
