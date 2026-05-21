'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', marginBottom: '24px' }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {idx > 0 && <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />}
          {item.href ? (
            <Link
              href={item.href}
              style={{
                color: 'var(--color-brand)',
                textDecoration: 'none',
                transition: 'opacity 200ms',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = '1'
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
