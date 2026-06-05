'use client'

import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Skeleton, EmptyState, ErrorMessage } from '@comfytag/ui'
import type { TierStats } from '@comfytag/types'
import { TiersEventAccordion } from '@/components/tiers/TiersEventAccordion'
import { TierEditModal } from '@/components/tiers/TierEditModal'
import { useMyEvents, useEventTierStats } from '@/hooks'
import { api } from '@/lib/api'

interface EditingTier extends TierStats {
  eventId: string
}

export default function TiersPage() {
  const queryClient = useQueryClient()
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [editingTier, setEditingTier] = useState<EditingTier | null>(null)

  // Fetch organizer's events
  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useMyEvents()

  // Fetch tiers for expanded event
  const expandedEventTiersQuery = useEventTierStats(expandedEventId || '')

  // Edit tier mutation
  const editTierMutation = useMutation({
    mutationFn: async (data: { name: string; price: number; capacity: number }) => {
      if (!editingTier) throw new Error('No tier selected')
      return api.put(
        `/events/${editingTier.eventId}/tiers/${editingTier._id}`,
        data
      ).then(r => r.data)
    },
    onSuccess: () => {
      if (expandedEventId) {
        queryClient.invalidateQueries({ queryKey: ['partner-events', 'tiers', expandedEventId] })
      }
      setEditingTier(null)
    },
  })

  // Delete tier mutation
  const deleteTierMutation = useMutation({
    mutationFn: async (params: [string, string]) => {
      const [eventId, tierId] = params
      return api.delete(
        `/events/${eventId}/tiers/${tierId}`
      ).then(r => r.data)
    },
    onSuccess: () => {
      if (expandedEventId) {
        queryClient.invalidateQueries({ queryKey: ['partner-events', 'tiers', expandedEventId] })
      }
    },
  })

  const tiersLoading = expandedEventId && expandedEventTiersQuery.isLoading
  const tiersMap = expandedEventTiersQuery.data?.tiers?.reduce((map, tier) => {
    if (expandedEventId) map[expandedEventId] = [tier]
    return map
  }, {} as Record<string, TierStats[]>) || {}

  const eventsWithTiers = events.map(event => ({
    ...event,
    tiers: tiersMap[event._id] ?? [],
  }))

  return (
    <div>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '32px', paddingBottom: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0, marginBottom: '4px' }}>
            TICKET TIERS
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Manage ticket tiers and pricing across all your events
          </p>
        </div>

        {/* Error states */}
        {eventsError && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorMessage message="Failed to load events." />
          </div>
        )}

        {/* Events with tiers */}
        {eventsLoading || tiersLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <Skeleton height={20} width="40%" />
                </div>
                <Skeleton height={56} width="100%" />
              </div>
            ))}
          </div>
        ) : eventsWithTiers.length === 0 ? (
          <div style={{ padding: '32px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
            <EmptyState
              title="No events yet"
              subtitle="Create an event to start managing ticket tiers"
              action={{ label: 'Create Event', href: '/events/create' }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {eventsWithTiers.map(event => (
              <TiersEventAccordion
                key={event._id}
                event={event}
                tiers={event.tiers ?? []}
                isExpanded={expandedEventId === event._id}
                onToggleExpand={() => setExpandedEventId(expandedEventId === event._id ? null : event._id)}
                onEditTier={setEditingTier}
                onDeleteTier={(tierId) => {
                  if (confirm('Delete this tier?')) {
                    void deleteTierMutation.mutate([event._id, tierId])
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Edit tier modal */}
        {editingTier && (
          <TierEditModal
            tier={editingTier}
            isLoading={editTierMutation.isPending}
            onSave={(data) => editTierMutation.mutate(data)}
            onCancel={() => setEditingTier(null)}
          />
        )}
      </div>
    </div>
  )
}

