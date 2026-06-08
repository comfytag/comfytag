'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { Button, Modal, Input, ErrorMessage } from '@comfytag/ui'
import { twoColGrid, cardStyle, fieldGroupStyle } from '@/lib/formStyles'
import { TierListRow } from '@/components/events/TierListRow'
import type { CreateEventFormData, TierInput } from '@/hooks/useCreateEventWizard'

interface Step3TiersProps {
  formData: CreateEventFormData
  handleAddTier: () => void
  handleEditTier: (index: number) => void
  handleRemoveTier: (index: number) => void
  handleOpenTierModal: () => void
  tierModal: boolean
  setTierModal: (open: boolean) => void
  currentTier: TierInput
  setCurrentTier: (tier: TierInput) => void
  editingIndex: number | null
  stepErrors: string
  onNext: () => void
  onPrev: () => void
}

export function Step3Tiers({
  formData,
  handleAddTier,
  handleEditTier,
  handleRemoveTier,
  handleOpenTierModal,
  tierModal,
  setTierModal,
  currentTier,
  setCurrentTier,
  editingIndex,
  stepErrors,
  onNext,
  onPrev,
}: Step3TiersProps) {
  return (
    <>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
            Ticket Tiers
          </h2>
          <Button variant="ghost" size="sm" onClick={handleOpenTierModal}>
            <Plus size={14} /> Add Tier
          </Button>
        </div>

        {formData.tiers.length === 0 ? (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-muted)',
              padding: '20px',
              textAlign: 'center',
              margin: 0,
              marginBottom: '20px',
            }}
          >
            No ticket tiers yet. Add at least one.
          </p>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            {formData.tiers.map((tier, i) => (
              <TierListRow
                key={i}
                name={tier.name}
                price={tier.price}
                capacity={tier.capacity}
                onEdit={() => handleEditTier(i)}
                onRemove={() => handleRemoveTier(i)}
              />
            ))}
          </div>
        )}

        {stepErrors && <ErrorMessage message={stepErrors} />}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <Button variant="ghost" onClick={onPrev}>
            ← Back
          </Button>
          <Button variant="primary" onClick={onNext} fullWidth>
            Next: Event Details →
          </Button>
        </div>
      </div>

      {/* Tier Modal */}
      <Modal
        isOpen={tierModal}
        onClose={() => setTierModal(false)}
        title={editingIndex !== null ? 'Edit Ticket Tier' : 'Add Ticket Tier'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTierModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddTier}>
              {editingIndex !== null ? 'Update Tier' : 'Add Tier'}
            </Button>
          </>
        }
      >
        <Input
          label="Tier Name"
          placeholder="e.g. Regular, VIP, VVIP"
          value={currentTier.name}
          onChange={e => setCurrentTier({ ...currentTier, name: e.target.value })}
        />
        <div style={{ ...twoColGrid, marginTop: '16px' }}>
          <Input
            label="Price (₦)"
            type="number"
            placeholder="0"
            value={currentTier.price}
            onChange={e => setCurrentTier({ ...currentTier, price: e.target.value })}
          />
          <Input
            label="Capacity"
            type="number"
            placeholder="0"
            value={currentTier.capacity}
            onChange={e => setCurrentTier({ ...currentTier, capacity: e.target.value })}
          />
        </div>
        {stepErrors && (
          <div style={{ marginTop: '12px' }}>
            <ErrorMessage message={stepErrors} />
          </div>
        )}
      </Modal>
    </>
  )
}
