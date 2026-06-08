'use client'

import React from 'react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { NIGERIAN_STATES, EVENT_CATEGORIES } from '@comfytag/utils'
import { fieldGroupStyle, labelStyle, selectStyle, twoColGrid, cardStyle } from '@/lib/formStyles'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface Step1BasicInfoProps {
  formData: CreateEventFormData
  updateField: (field: keyof CreateEventFormData, value: unknown) => void
  stepErrors: string
  onNext: () => void
  onPrev: () => void
}

export function Step1BasicInfo({
  formData,
  updateField,
  stepErrors,
  onNext,
  onPrev,
}: Step1BasicInfoProps) {
  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--color-text)' }}>
        Basic Event Info
      </h2>

      <div style={fieldGroupStyle}>
        <Input
          label="Event Name"
          placeholder="e.g. Summer Festival 2025"
          value={formData.name}
          onChange={e => updateField('name', e.target.value)}
          required
        />
      </div>

      <div style={twoColGrid}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Category</label>
          <select
            value={formData.category}
            onChange={e => updateField('category', e.target.value)}
            style={selectStyle}
          >
            <option value="">Select category</option>
            {EVENT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={e => updateField('date', e.target.value)}
            style={{
              width: '100%',
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
      </div>

      <div style={twoColGrid}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Start Time</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={e => updateField('startTime', e.target.value)}
            style={{
              width: '100%',
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
          <label style={labelStyle}>End Time</label>
          <input
            type="time"
            value={formData.endTime}
            onChange={e => updateField('endTime', e.target.value)}
            style={{
              width: '100%',
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
      </div>

      <div style={fieldGroupStyle}>
        <Input
          label="Venue Name"
          placeholder="e.g. Lekki Conservancy"
          value={formData.venue}
          onChange={e => updateField('venue', e.target.value)}
        />
      </div>

      <div style={fieldGroupStyle}>
        <Input
          label="Address"
          placeholder="e.g. Plot 50, Admiralty Way, Lekki"
          value={formData.address}
          onChange={e => updateField('address', e.target.value)}
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>State</label>
        <select
          value={formData.state}
          onChange={e => updateField('state', e.target.value)}
          style={selectStyle}
        >
          <option value="">Select state</option>
          {NIGERIAN_STATES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {stepErrors && <ErrorMessage message={stepErrors} />}

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <Button variant="ghost" onClick={onPrev} disabled>
          ← Back
        </Button>
        <Button variant="primary" onClick={onNext} fullWidth>
          Next: Cover Image →
        </Button>
      </div>
    </div>
  )
}
