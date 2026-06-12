'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button, Badge, PageHeader } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { formatDate } from '@comfytag/utils'

interface EventDetailHeaderProps {
  event: Event
  eventId: string
  onStatusChange: (status: 'published' | 'draft' | 'cancelled') => void
  isStatusPending: boolean
}

export function EventDetailHeader({
  event,
  eventId,
  onStatusChange,
  isStatusPending,
}: EventDetailHeaderProps) {
  if (!event) {
    return null
  }

  return (
    <>
      <PageHeader
        title={event.name || 'Untitled Event'}
        subtitle={`${event.date ? formatDate(event.date) : 'No date'} · ${event.venue || 'No venue'}`}
        action={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/events"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--color-text-muted)',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} /> All Events
            </Link>
            <Link href={`/events/${eventId}/analytics`}>
              <Button variant="ghost" size="sm">
                Analytics
              </Button>
            </Link>
            <Link href={`/events/${eventId}/edit`}>
              <Button variant="ghost" size="sm">
                Edit Event
              </Button>
            </Link>
            {event.status === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                loading={isStatusPending}
                onClick={() => onStatusChange('published')}
              >
                Publish
              </Button>
            )}
            {event.status === 'published' && (
              <Link href={`/events/${eventId}/gate`}>
                <Button variant="ghost" size="sm">
                  Open Gate
                </Button>
              </Link>
            )}
            {event.status === 'published' && (
              <Button
                variant="ghost"
                size="sm"
                loading={isStatusPending}
                onClick={() => onStatusChange('draft')}
              >
                Move to Draft
              </Button>
            )}
            {event.status !== 'cancelled' && event.status !== 'ended' && (
              <Button
                variant="danger"
                size="sm"
                loading={isStatusPending}
                onClick={() => onStatusChange('cancelled')}
              >
                Cancel Event
              </Button>
            )}
          </div>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Badge
          status={
            event.status === 'published'
              ? 'approved'
              : event.status === 'cancelled'
                ? 'rejected'
                : event.status || 'draft'
          }
        />
        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
          {event.address || 'No address'}, {event.state || 'No state'}
        </span>
        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
          {event.startTime || 'TBA'} – {event.endTime || 'TBA'}
        </span>
      </div>
    </>
  )
}
