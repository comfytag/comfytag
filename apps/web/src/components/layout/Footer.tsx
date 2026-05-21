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

        <nav aria-label="Footer links" style={{ display: 'flex', gap: '16px' }}>
          {[
            { label: 'About', href: '/about' },
            { label: 'Terms', href: '/terms' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Contact', href: '/contact' },
          ].map((item) => (
            <a key={item.href} href={item.href} className="__ct_footer_link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="__ct_footer_section">
          <span>© {currentYear} ComfyTag</span>
        </div>
      </footer>
    </>
  )
}
