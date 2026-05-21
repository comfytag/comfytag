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
        fontSize: '14px',
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        marginBottom: `${marginBottom}px`,
        cursor: 'pointer',
      }}
    >
      ← {children}
    </Link>
  )
}
