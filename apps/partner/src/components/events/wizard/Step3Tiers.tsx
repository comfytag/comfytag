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
      <div className="max-w-3xl mx-auto bg-(--color-surface) border border-(--color-border) rounded-xl p-6 sm:p-10 mt-8 animate-in fade-in duration-300 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400 font-bold mb-4 block">Step 3 of 5</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-(--color-text) mb-2">Ticket Tiers</h2>
            <p className="text-sm text-(--color-text-muted) mb-8">Set prices, names, and capacities</p>
          </div>
          <button
            type="button"
            onClick={handleOpenTierModal}
            className="flex items-center gap-1.5 text-sm font-bold text-violet-400 bg-violet-950/40 hover:bg-violet-900/50 border border-violet-900/50 px-4 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0 mt-10"
          >
            <Plus size={14} aria-hidden="true" />
            Add Tier
          </button>
        </div>

        {/* Tier list */}
        {formData.tiers.length === 0 ? (
          <div className="border-2 border-dashed border-zinc-700 rounded-3xl p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Plus size={18} className="text-zinc-400" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-zinc-400">No tiers yet</p>
            <p className="text-xs text-zinc-500 mt-1">Add at least one ticket tier to continue</p>
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
          <div className="bg-violet-950/40 border border-violet-900/50 rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-400">
              {formData.tiers.length} tier{formData.tiers.length > 1 ? 's' : ''} configured
            </span>
            <span className="text-xs text-violet-400/80">
              Total capacity:{' '}
              <span className="font-bold">
                {formData.tiers.some(t => t.capacity.trim() === '')
                  ? 'Unlimited'
                  : formData.tiers.reduce((s, t) => s + Number(t.capacity), 0).toLocaleString()}
              </span>
            </span>
          </div>
        )}

        {/* Error */}
        {stepErrors && <ErrorMessage message={stepErrors} />}

      </div>

      {/* Sticky nav bar */}
      <div
        className="fixed bottom-0 max-md:bottom-24 inset-x-0 bg-(--color-surface) border-t border-(--color-border) p-4 z-50"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <button
            type="button"
            onClick={onPrev}
            className="bg-(--color-surface) border border-(--color-border) text-zinc-300 font-bold py-3 px-8 rounded-full hover:bg-zinc-800 active:scale-95 transition-all text-sm"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="bg-violet-600 text-white font-bold py-3 px-8 rounded-full active:scale-95 transition-all text-sm"
          >
            Next: Event Details →
          </button>
        </div>
      </div>

      {/* Tier Modal — kept as-is (uses CSS-variable theme from @comfytag/ui) */}
      <Modal
        isOpen={tierModal}
        onClose={() => setTierModal(false)}
        closeOnBackdropClick={false}
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
            label="Capacity (blank = unlimited)"
            type="number"
            placeholder="Unlimited"
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
