import Link from 'next/link'

export interface BackLinkProps {
  href: string
  children: React.ReactNode
  marginBottom?: number
}

export function BackLink({ href, children, marginBottom = 20 }: BackLinkProps) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        marginBottom: `${marginBottom}px`,
      }}
    >
      <span className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-zinc-200/80 shadow-sm transition-all hover:bg-zinc-50 active:scale-95 text-zinc-900">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </span>
      {children && (
        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {children}
        </span>
      )}
    </Link>
  )
}
