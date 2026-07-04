'use client'

import { useState } from 'react'
import { Skeleton, EmptyState, ErrorMessage } from '@comfytag/ui'
import type { TierStats } from '@comfytag/types'
import { TiersEventAccordion } from '@/components/tiers/TiersEventAccordion'
import { TierEditModal } from '@/components/tiers/TierEditModal'
import { useMyEvents, useEventTierStats, useUpdateTier, useDeleteTier } from '@/hooks'

interface EditingTier extends TierStats {
  eventId: string
}

export default function TiersPage() {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [editingTier, setEditingTier] = useState<EditingTier | null>(null)

  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useMyEvents()
  const expandedEventTiersQuery = useEventTierStats(expandedEventId ?? '')

  const updateTierMutation = useUpdateTier()
  const deleteTierMutation = useDeleteTier()

  const tiersLoading = expandedEventId && expandedEventTiersQuery.isLoading

  const tiersMap: Record<string, TierStats[]> = {}
  if (expandedEventId && expandedEventTiersQuery.data?.tiers) {
    tiersMap[expandedEventId] = expandedEventTiersQuery.data.tiers
  }

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
        {deleteTierMutation.isError && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorMessage
              message={
                (deleteTierMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Failed to delete tier. Please try again.'
              }
            />
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
                    void deleteTierMutation.mutate({ eventId: event._id, tierId })
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
            isLoading={updateTierMutation.isPending}
            onSave={(data) =>
              updateTierMutation.mutate(
                { eventId: editingTier.eventId, tierId: editingTier._id, data },
                { onSuccess: () => setEditingTier(null) }
              )
            }
            onCancel={() => setEditingTier(null)}
          />
        )}
      </div>
    </div>
  )
}

