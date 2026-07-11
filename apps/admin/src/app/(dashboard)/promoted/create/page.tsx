'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Badge, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import type { Event } from '@comfytag/types'
import api from '@/lib/api'
import { DataTable } from '@comfytag/ui'
import type { ColumnDef } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'

// ─── Query fetch functions ─────────────────────────────
const fetchEvents = async (): Promise<Event[]> => {
  const { data } = await api.get<{ data: Event[] }>('/admin/event')
  return data.data ?? []
}

const featureEvent = async (id: string): Promise<void> => {
  await api.put(`/admin/event/${id}`, { featured: true })
}

function createColumns(
  onFeature: (id: string) => void,
  currentFeaturingId: string | null,
  setFeaturingId: (id: string | null) => void,
): ColumnDef<Event>[] {
  return [
    { key: 'name', header: 'Event', render: (e) => e.name },
    { key: 'organizer', header: 'Organizer', render: (e) => e.planner },
    { key: 'date', header: 'Date', render: (e) => formatDate(e.date) },
    { key: 'status', header: 'Status', render: (e) => <Badge status={e.status} /> },
    {
      key: 'action',
      header: '',
      render: (e) => (
        <button
          onClick={() => {
            setFeaturingId(e._id)
            onFeature(e._id)
          }}
          disabled={currentFeaturingId === e._id}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: 'var(--color-brand)',
            color: '#fff',
            opacity: currentFeaturingId === e._id ? 0.6 : 1,
          }}
        >
          {currentFeaturingId === e._id ? 'Featuring...' : 'Feature'}
        </button>
      ),
    },
  ]
}

export default function PromotedCreatePage() {
  const { data: session } = useSession()
  void session

  const queryClient = useQueryClient()
  const [featuringId, setFeaturingId] = useState<string | null>(null)

  const { data: events, isLoading, isError } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: fetchEvents,
  })

  const featureMutation = useMutation({
    mutationFn: (id: string) => featureEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] })
      setFeaturingId(null)
    },
    onError: () => {
      setFeaturingId(null)
    },
  })

  const nonFeatured = (events ?? []).filter((e) => !e.featured && e.status === 'published')

  const columns = useMemo(
    () => createColumns((id) => featureMutation.mutate(id), featuringId, setFeaturingId),
    [featuringId, featureMutation.mutate]
  )

  return (
    <div>
      <PageHeader
        title="Feature an Event"
        subtitle={`${nonFeatured.length} published events available`}
        action={
          <Link
            href="/promoted"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Promoted
          </Link>
        }
      />
      {isLoading && <LoadingSpinner size="md" centered />}
      {isError && <ErrorMessage message="Failed to load events" />}
      {featureMutation.isError && <ErrorMessage message="Failed to feature event. Please try again." />}
      {!isLoading && !isError && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <DataTable
            columns={columns}
            data={nonFeatured}
          />
        </div>
      )}
    </div>
  )
}
