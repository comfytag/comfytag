'use client'

import { Plus } from 'lucide-react'
import { Button, Input, Modal, ErrorMessage } from '@comfytag/ui'
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

function BackIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
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
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-zinc-900">Ticket Tiers</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Set prices, names, and capacities</p>
          </div>
          <button
            type="button"
            onClick={handleOpenTierModal}
            className="flex items-center gap-1.5 text-sm font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-4 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Plus size={14} aria-hidden="true" />
            Add Tier
          </button>
        </div>

        {/* Tier list */}
        {formData.tiers.length === 0 ? (
          <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
              <Plus size={18} className="text-zinc-400" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-zinc-500">No tiers yet</p>
            <p className="text-xs text-zinc-400 mt-1">Add at least one ticket tier to continue</p>
          </div>
        ) : (
          <div className="space-y-2">
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

        {/* Tier count summary pill */}
        {formData.tiers.length > 0 && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-700">
              {formData.tiers.length} tier{formData.tiers.length > 1 ? 's' : ''} configured
            </span>
            <span className="text-xs text-violet-500">
              Total capacity:{' '}
              <span className="font-bold">
                {formData.tiers.reduce((s, t) => s + Number(t.capacity), 0).toLocaleString()}
              </span>
            </span>
          </div>
        )}

        {/* Error */}
        {stepErrors && <ErrorMessage message={stepErrors} />}

        {/* Nav */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
          >
            <BackIcon />
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex-1 bg-violet-600 text-white text-sm font-bold py-4 rounded-2xl hover:bg-violet-700 active:bg-violet-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Next: Event Details →
          </button>
        </div>
      </div>

      {/* Tier Modal — kept as-is (uses CSS-variable theme from @comfytag/ui) */}
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
          onChange={(e) => setCurrentTier({ ...currentTier, name: e.target.value })}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <Input
            label="Price (₦)"
            type="number"
            placeholder="0"
            value={currentTier.price}
            onChange={(e) => setCurrentTier({ ...currentTier, price: e.target.value })}
          />
          <Input
            label="Capacity"
            type="number"
            placeholder="0"
            value={currentTier.capacity}
            onChange={(e) => setCurrentTier({ ...currentTier, capacity: e.target.value })}
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
