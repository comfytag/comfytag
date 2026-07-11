'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Ticket, Users, Banknote, Star } from 'lucide-react'
import { Badge, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { Event, TicketTier } from '@comfytag/types'
import api from '@/lib/api'
import { StatCard } from '@comfytag/ui'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'

// ─── Query fetch functions ─────────────────────────────
const fetchEvent = async (id: string): Promise<Event> => {
  const { data } = await api.get<{ success: boolean; data: Event }>(`/admin/event/${id}`)
  return data.data
}

const toggleFeatured = async (id: string, featured: boolean): Promise<void> => {
  await api.put(`/admin/event/${id}`, { featured })
}

// ─── InfoField component ───────────────────────────────
function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--color-text)' }}>{value}</div>
    </div>
  )
}

// ─── Ticket tier columns ───────────────────────────────
const tierColumns: ColumnDef<TicketTier>[] = [
  { key: 'name', header: 'Tier Name', render: (t) => t.name },
  {
    key: 'price',
    header: 'Price',
    render: (t) => (
      <span style={{ color: 'var(--color-gold)' }}>{formatNaira(t.price)}</span>
    ),
  },
  { key: 'capacity', header: 'Capacity', render: (t) => t.capacity },
  { key: 'sold', header: 'Sold', render: (t) => t.sold },
  { key: 'available', header: 'Available', render: (t) => t.capacity - t.sold },
]

export default function PromotedDetailPage() {
  const { data: session } = useSession()
  void session

  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['admin', 'event', id],
    queryFn: () => fetchEvent(id),
    enabled: !!id,
  })

  const featureMutation = useMutation({
    mutationFn: (featured: boolean) => toggleFeatured(id, featured),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'event', id] }),
  })

  if (isLoading) return <LoadingSpinner size="lg" centered />
  if (isError || !event) return <ErrorMessage message="Failed to load event" />

  return (
    <div>
      <PageHeader
        title={event.name}
        action={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link
              href="/promoted"
              style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
            >
              ← Back
            </Link>
            <button
              onClick={() => featureMutation.mutate(!event.featured)}
              disabled={featureMutation.isPending}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                backgroundColor: event.featured ? 'var(--color-error)' : 'var(--color-brand)',
                color: '#fff',
                opacity: featureMutation.isPending ? 0.6 : 1,
              }}
            >
              {featureMutation.isPending ? '...' : event.featured ? 'Remove from Promoted' : 'Add to Promoted'}
            </button>
          </div>
        }
      />

      {/* Event info card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <InfoField label="Date" value={formatDate(event.date)} />
          <InfoField label="Venue" value={event.venue} />
          <InfoField label="Address" value={event.address} />
          <InfoField label="State" value={event.state} />
          <InfoField label="Category" value={event.category} />
          <InfoField label="Status" value={<Badge status={event.status} />} />
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard icon={Ticket} value={event.sold} label="Tickets Sold" />
        <StatCard
          icon={Users}
          value={(event.ticketType ?? []).reduce((s, t) => s + t.capacity, 0)}
          label="Total Capacity"
        />
        <div style={{ '--color-text': 'var(--color-gold)' } as unknown as CSSProperties}>
          <StatCard
            icon={Banknote}
            value={formatNaira(event.sold * (event.ticketType?.[0]?.price ?? 0))}
            label="Est. Revenue"
          />
        </div>
        <StatCard icon={Star} value={event.featured ? 'Yes' : 'No'} label="Featured" />
      </div>

      {/* Ticket tiers */}
      {(event.ticketType ?? []).length > 0 && (
        <>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: 16,
            }}
          >
            Ticket Tiers
          </h2>
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <DataTable<TicketTier> columns={tierColumns} data={event.ticketType ?? []} />
          </div>
        </>
      )}
    </div>
  )
}
