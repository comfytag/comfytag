'use client'

import { ChevronDown } from 'lucide-react'
import type { Event, TierStats } from '@comfytag/types'
import { TierProgressCard } from '@/components/events/TierProgressCard'
import { TierListRow } from '@/components/events/TierListRow'

interface TiersEventAccordionProps {
  event: Event
  tiers: TierStats[]
  isExpanded: boolean
  onToggleExpand: () => void
  onEditTier: (tier: TierStats & { eventId: string }) => void
  onDeleteTier: (tierId: string) => void
}

export function TiersEventAccordion({
  event,
  tiers,
  isExpanded,
  onToggleExpand,
  onEditTier,
  onDeleteTier,
}: TiersEventAccordionProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggleExpand}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background var(--duration-fast) ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-2)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px 0' }}>
            {event.name}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            {tiers.length} tier{tiers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronDown
          size={20}
          style={{
            color: 'var(--color-text-muted)',
            transition: 'transform var(--duration-fast) ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px' }}>
          {tiers.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0, padding: '12px' }}>
              No tiers for this event
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Grid of tier cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {tiers.map(tier => (
                  <TierProgressCard key={tier._id} tier={tier} />
                ))}
              </div>

              {/* Tier rows with edit/delete */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                  Manage
                </h4>
                <div>
                  {tiers.map(tier => (
                    <TierListRow
                      key={tier._id}
                      name={tier.name}
                      price={tier.price}
                      capacity={tier.capacity}
                      onEdit={() => onEditTier({ ...tier, eventId: event._id })}
                      onRemove={() => onDeleteTier(tier._id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
