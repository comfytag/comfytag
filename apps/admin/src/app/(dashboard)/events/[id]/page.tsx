'use client'

import type { CSSProperties } from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Ticket, Users, Banknote, Star } from 'lucide-react'
import { Badge, LoadingSpinner, ErrorMessage, Button } from '@comfytag/ui'
import { formatNaira, formatDate } from '@comfytag/utils'
import type { Event, TicketTier } from '@comfytag/types'
import api from '@/lib/api'
import { StatCard } from '@comfytag/ui'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import { MediaUploader } from '@comfytag/ui'

// ─── Query fetch function ──────────────────────────────
const fetchEvent = async (id: string): Promise<Event> => {
  const { data } = await api.get<Event>(`/admin/event/${id}`)
  return data
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

export default function EventDetailPage() {
  const { data: session } = useSession()
  void session

  const { id } = useParams<{ id: string }>()
  const [images, setImages] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [mediaError, setMediaError] = useState('')

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['admin', 'event', id],
    queryFn: () => fetchEvent(id),
    enabled: !!id,
  })

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/admin/event/${id}`, { images, videoUrl }),
    onSuccess: () => {
      setMediaError('')
    },
    onError: () => setMediaError('Failed to save media. Please try again.'),
  })

  async function handleUpload(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post<{ url: string }>('/upload', fd)
    return res.data.url
  }

  useEffect(() => {
    if (!event) return
    if (event.images) setImages(event.images)
    if (event.videoUrl) setVideoUrl(event.videoUrl)
  }, [event])

  if (isLoading) return <LoadingSpinner size="lg" centered />
  if (isError || !event) return <ErrorMessage message="Failed to load event" />

  return (
    <div>
      <PageHeader
        title={event.name}
        action={
          <Link
            href="/events"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Events
          </Link>
        }
      />

      {/* Event info card */}
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
          value={event.ticketType.reduce((s, t) => s + t.capacity, 0)}
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
      {event.ticketType.length > 0 && (
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
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <DataTable<TicketTier> columns={tierColumns} data={event.ticketType} />
          </div>
        </>
      )}

      {/* Media Section */}
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: 16,
          marginTop: 32,
        }}
      >
        Event Media
      </h2>
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <MediaUploader
            label="Event Images"
            accept="image"
            multiple
            urls={images}
            onAdd={(newUrls) => setImages([...images, ...newUrls])}
            onRemove={(url) => setImages(images.filter(u => u !== url))}
            uploadFn={handleUpload}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <MediaUploader
            label="Promo Video (Optional)"
            accept="video"
            urls={videoUrl ? [videoUrl] : []}
            onAdd={(newUrls) => setVideoUrl(newUrls[0] ?? '')}
            onRemove={() => setVideoUrl('')}
            uploadFn={handleUpload}
          />
        </div>

        {mediaError && <ErrorMessage message={mediaError} />}

        <Button
          variant="primary"
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          style={{ marginTop: mediaError ? 12 : 0 }}
        >
          Save Media
        </Button>
      </div>
    </div>
  )
}
