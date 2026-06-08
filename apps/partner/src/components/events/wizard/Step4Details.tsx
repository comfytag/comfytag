'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { Button, ErrorMessage } from '@comfytag/ui'
import { fieldGroupStyle, labelStyle, cardStyle } from '@/lib/formStyles'
import { PerformerTag } from '@/components/events/PerformerTag'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface Step4DetailsProps {
  formData: CreateEventFormData
  updateField: (field: keyof CreateEventFormData, value: unknown) => void
  handleAddPerformer: () => void
  handleRemovePerformer: (index: number) => void
  performerInput: string
  setPerformerInput: (val: string) => void
  stepErrors: string
  onNext: () => void
  onPrev: () => void
}

export function Step4Details({
  formData,
  updateField,
  handleAddPerformer,
  handleRemovePerformer,
  performerInput,
  setPerformerInput,
  stepErrors,
  onNext,
  onPrev,
}: Step4DetailsProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddPerformer()
    }
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--color-text)' }}>
        Event Details
      </h2>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={formData.description}
          onChange={e => updateField('description', e.target.value)}
          placeholder="Tell attendees about your event..."
          style={{
            width: '100%',
            height: '120px',
            resize: 'vertical',
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Performers/Lineup (Optional)</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={performerInput}
            onChange={e => setPerformerInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add performer name and press Enter"
            style={{
              flex: 1,
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box' as const,
            }}
          />
          <Button variant="ghost" size="sm" onClick={handleAddPerformer}>
            <Plus size={16} />
          </Button>
        </div>
        {formData.performers.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {formData.performers.map((performer, idx) => (
              <PerformerTag
                key={idx}
                name={performer}
                onRemove={() => handleRemovePerformer(idx)}
              />
            ))}
          </div>
        )}
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Special Notes/Requirements (Optional)</label>
        <textarea
          value={formData.details.specialNotes}
          onChange={e =>
            updateField('details', {
              ...formData.details,
              specialNotes: e.target.value,
            })
          }
          placeholder="e.g. Age restrictions, dress code, items not allowed..."
          style={{
            width: '100%',
            height: '80px',
            resize: 'vertical',
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={formData.details.isPublic}
            onChange={e =>
              updateField('details', {
                ...formData.details,
                isPublic: e.target.checked,
              })
            }
            style={{ cursor: 'pointer' }}
          />
          <span>Make event public (visible to all attendees)</span>
        </label>
      </div>

      {stepErrors && <ErrorMessage message={stepErrors} />}

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <Button variant="ghost" onClick={onPrev}>
          ← Back
        </Button>
        <Button variant="primary" onClick={onNext} fullWidth>
          Review & Publish →
        </Button>
      </div>
    </div>
  )
}
