'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2, Copy } from 'lucide-react'
import { Button, Input, Modal, ErrorMessage, LoadingSpinner, PageHeader } from '@comfytag/ui'
import { formatDate, formatNaira } from '@comfytag/utils'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { useEventPromos, useCreatePromo, useDeletePromo } from '@/hooks'

export default function PromosPage() {
  const params = useParams<{ id: string }>()
  const eventId = params.id

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    maxUses: '',
    expiresAt: '',
  })
  const [error, setError] = useState('')

  const { data: promos = [], isLoading, isError, refetch: refetchPromos } = useEventPromos(eventId)
  const createPromoMutation = useCreatePromo()
  const deletePromoMutation = useDeletePromo()

  function handleAddPromo() {
    setError('')
    if (!form.code.trim()) {
      setError('Promo code is required')
      return
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setError('Discount value must be greater than 0')
      return
    }
    if (!form.maxUses || Number(form.maxUses) <= 0) {
      setError('Max uses must be greater than 0')
      return
    }
    createPromoMutation.mutate({
      eventId,
      payload: {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxUses: Number(form.maxUses),
        expiresAt: form.expiresAt || undefined,
      },
    }, {
      onSuccess: () => {
        setShowModal(false)
        setForm({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiresAt: '' })
        setError('')
      },
      onError: () => {
        setError('Failed to create promo code. Please try again.')
      },
    })
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code)
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <ErrorMessage message="Failed to load promo codes." />
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: 'Event', href: `/events/${eventId}` },
          { label: 'Promo Codes' },
        ]}
      />
      <PageHeader
        title="Promo Codes"
        subtitle="Create discount codes for your attendees"
        action={
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Promo Code
          </Button>
        }
      />

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {promos.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
              No promo codes yet. Create one to offer discounts to your attendees.
            </p>
          </div>
        ) : (
          <div>
            {promos.map((promo) => (
              <div
                key={promo._id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 150ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-surface-2)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                    {promo.code}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    {promo.discountType === 'percentage'
                      ? `${promo.discountValue}% off`
                      : `${formatNaira(promo.discountValue)} off`}
                    {' • '}
                    {promo.usedCount}/{promo.maxUses ?? 0} used
                    {' • '}
                    Expires: {formatDate(promo.expiresAt)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: promo.isActive ? 'var(--color-success)' : 'var(--color-surface-2)',
                        color: promo.isActive ? 'white' : 'var(--color-text-muted)',
                      }}
                    >
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {promo.usedCount >= (promo.maxUses ?? 0) && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-surface-2)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        Limit reached
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => copyToClipboard(promo.code)}
                    title="Copy code"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => deletePromoMutation.mutate({ eventId, code: promo.code })}
                    disabled={deletePromoMutation.isPending}
                    title="Delete code"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: deletePromoMutation.isPending ? 'wait' : 'pointer',
                      padding: '4px',
                      color: 'var(--color-error)',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: deletePromoMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setError('')
          setForm({ code: '', discountType: 'percentage', discountValue: '', maxUses: '', expiresAt: '' })
        }}
        title="Create Promo Code"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={createPromoMutation.isPending} onClick={handleAddPromo}>
              Create Code
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Promo Code"
            placeholder="e.g. SUMMER20"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
              Discount Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {(['percentage', 'fixed'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, discountType: type })}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: form.discountType === type ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                    backgroundColor: form.discountType === type ? 'var(--color-brand)' : 'transparent',
                    color: form.discountType === type ? 'white' : 'var(--color-text)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₦)'}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={form.discountType === 'percentage' ? 'Discount %' : 'Discount Amount (₦)'}
            type="number"
            placeholder={form.discountType === 'percentage' ? '10' : '500'}
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
          />

          <Input
            label="Max Uses"
            type="number"
            placeholder="100"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          />

          <Input
            label="Expiry Date"
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />

          {error && <ErrorMessage message={error} />}
        </div>
      </Modal>
    </div>
  )
}
