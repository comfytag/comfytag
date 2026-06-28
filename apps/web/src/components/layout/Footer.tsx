import Link from 'next/link'

const SOCIAL_LINKS = [
  {
    label: 'Twitter / X',
    href: 'https://x.com/comfytag',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/comfytag',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <style>{`
        .__ct_footer {
          border-top: 1px solid var(--color-border);
          background: var(--color-bg);
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 12px;
          color: var(--color-text-muted);
        }
        .__ct_footer_link {
          color: var(--color-text-muted);
          text-decoration: none;
          transition: color var(--duration-micro) ease;
        }
        .__ct_footer_link:hover {
          color: var(--color-text);
        }
        .__ct_footer_link:focus-visible {
          outline: 2px solid var(--color-brand);
          outline-offset: 2px;
          border-radius: var(--radius-sm);
        }
        .__ct_footer_section {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .__ct_footer_social_link {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          transition: color var(--duration-micro) ease;
          padding: 4px;
          border-radius: var(--radius-sm);
        }
        .__ct_footer_social_link:hover {
          color: var(--color-brand);
        }
        .__ct_footer_social_link:focus-visible {
          outline: 2px solid var(--color-brand);
          outline-offset: 2px;
        }
        @media (max-width: 767px) {
          .__ct_footer {
            padding: 16px;
            flex-direction: column;
            gap: 12px;
          }
          .__ct_footer_section {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
      <footer className="__ct_footer" aria-label="Footer">
        <div className="__ct_footer_section">
          <span>Secured by</span>
          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>Paystack</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <nav aria-label="Footer links" style={{ display: 'flex', gap: '16px' }}>
            {[
              { label: 'About', href: '/about' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Contact', href: '/contact' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="__ct_footer_link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} role="list" aria-label="Social links">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="__ct_footer_social_link"
                role="listitem"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="__ct_footer_section">
          <span>© {currentYear} ComfyTag</span>
        </div>
      </footer>
    </>
  )
}
