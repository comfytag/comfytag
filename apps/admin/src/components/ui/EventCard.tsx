import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@comfytag/ui'
import type { Event } from '@comfytag/types'

interface EventCardProps {
  event: Event
  href: string
}

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export function EventCard({ event, href }: EventCardProps) {
  const coverImage = event.images[0]

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'border-color var(--duration-micro) var(--ease-standard)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-brand-light)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'
      }}
    >
      <div style={{ position: 'relative', height: '180px', backgroundColor: 'var(--color-surface-2)' }}>
        {coverImage ? (
          <Image
            src={coverImage}
            alt={event.name}
            fill
            unoptimized
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '13px',
            }}
          >
            No image
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-text)',
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {event.name}
          </span>
          <Badge status={event.status} />
        </div>

        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {dateFormatter.format(new Date(event.date))}
        </div>

        <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {event.venue}
        </div>
      </div>
    </Link>
  )
}
