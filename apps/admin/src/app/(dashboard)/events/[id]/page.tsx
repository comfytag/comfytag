'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Ticket, Users, Banknote, Star, AlertTriangle } from 'lucide-react'
import {
  LoadingSpinner,
  ErrorMessage,
  Badge,
  StatCard,
  InfoField,
  DataTable,
  PageHeader,
} from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import type { TicketTier } from '@comfytag/types'
import { formatNaira, formatDate, formatTime } from '@comfytag/utils'
import { EventActionPanel } from '@/components/events/EventActionPanel'
import { useAdminEventDetail } from '@/hooks'

// ─── Ticket tier table columns ─────────────────────────────────────────────────

const tierColumns: ColumnDef<TicketTier>[] = [
  {
    key: 'name',
    header: 'Tier',
    render: (t) => <span style={{ fontWeight: 500 }}>{t.name}</span>,
  },
  {
    key: 'price',
    header: 'Price',
    render: (t) => (
      <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
        {formatNaira(t.price)}
      </span>
    ),
  },
  {
    key: 'sold',
    header: 'Sold',
    render: (t) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t.sold}</span>,
  },
  {
    key: 'capacity',
    header: 'Capacity',
    render: (t) => (
      <span style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {t.capacity}
      </span>
    ),
  },
  {
    key: 'available',
    header: 'Available',
    render: (t) => {
      const remaining = t.capacity - t.sold
      const pct = t.capacity > 0 ? Math.round((t.sold / t.capacity) * 100) : 0
      return (
        <div>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{remaining}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 12, marginLeft: 6 }}>
            ({pct}% sold)
          </span>
        </div>
      )
    },
  },
  {
    key: 'revenue',
    header: 'Revenue',
    render: (t) => (
      <span style={{ color: 'var(--color-gold)', fontVariantNumeric: 'tabular-nums' }}>
        {formatNaira(t.price * t.sold)}
      </span>
    ),
  },
]

// ─── Suspension banner ────────────────────────────────────────────────────────

function SuspensionBanner({ eventName }: { eventName: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '16px 20px',
        borderRadius: 12,
        border: '1px solid rgba(239, 68, 68, 0.4)',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        marginBottom: 24,
      }}
    >
      <AlertTriangle
        size={20}
        style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }}
      />
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-error)',
            marginBottom: 4,
          }}
        >
          Event Suspended
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--color-text)' }}>{eventName}</strong> has been
          suspended by the admin team. Ticket sales and check-in are currently halted.
          Use the controls below to restore this event.
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const { data: event, isLoading, isError, refetch } = useAdminEventDetail(id)

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError || !event) {
    return (
      <ErrorMessage
        message="Failed to load event"
        onRetry={() => void refetch()}
      />
    )
  }

  const totalCapacity = (event.ticketType ?? []).reduce((sum, t) => sum + t.capacity, 0)
  const totalRevenue  = (event.ticketType ?? []).reduce((sum, t) => sum + t.price * t.sold, 0)
  const coverImage    = event.coverImage ?? event.images?.[0]

  return (
    <div style={{ padding: '32px 24px' }}>
      {/* ─── Suspension banner ─────────────────────────────── */}
      {event.status === 'cancelled' && (
        <SuspensionBanner eventName={event.name} />
      )}

      {/* ─── Header ────────────────────────────────────────── */}
      <PageHeader
        title={event.name}
        subtitle={`by ${event.planner}`}
        action={
          <Link
            href="/events"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Events
          </Link>
        }
      />

      {/* ─── Cover image ───────────────────────────────────── */}
      {coverImage && (
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 24,
            border: '1px solid var(--color-border)',
            maxHeight: 320,
          }}
        >
          <img
            src={coverImage}
            alt={event.name}
            style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* ─── Event metadata card ───────────────────────────── */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 20,
          }}
        >
          <InfoField label="Date"      value={formatDate(event.date)} />
          <InfoField label="Time"      value={`${formatTime(event.startTime)} – ${formatTime(event.endTime)}`} />
          <InfoField label="Venue"     value={event.venue} />
          <InfoField label="Address"   value={event.address} />
          <InfoField label="State"     value={event.state} />
          <InfoField label="Category"  value={event.category} />
          <InfoField label="Status"    value={<Badge status={event.status} />} />
          <InfoField
            label="Organizer"
            value={
              event.planner_id ? (
                <Link
                  href={`/users/${event.planner_id}`}
                  style={{ color: 'var(--color-brand)', textDecoration: 'none', fontSize: 14 }}
                >
                  {event.planner} →
                </Link>
              ) : (
                event.planner
              )
            }
          />
          {event.description && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Description
              </div>
              <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
                {event.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stat cards ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard icon={Ticket}  label="Tickets Sold"    value={event.sold} />
        <StatCard icon={Users}   label="Total Capacity"  value={totalCapacity} />
        <StatCard icon={Banknote} label="Total Revenue"  value={formatNaira(totalRevenue)} />
        <StatCard icon={Star}    label="Featured"        value={event.featured ? 'Yes' : 'No'} />
      </div>

      {/* ─── Ticket tier breakdown ─────────────────────────── */}
      {(event.ticketType ?? []).length > 0 && (
        <>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--color-text)',
              margin: '0 0 12px',
            }}
          >
            Ticket Tiers
          </h2>
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 28,
            }}
          >
            <DataTable<TicketTier>
              columns={tierColumns}
              data={event.ticketType ?? []}
              keyField="_id"
              emptyTitle="No ticket tiers defined"
              emptySubtitle="This event has no ticket tiers configured."
            />
          </div>
        </>
      )}

      {/* ─── Moderation action panel ───────────────────────── */}
      <EventActionPanel eventId={event._id} event={event} />
    </div>
  )
}
