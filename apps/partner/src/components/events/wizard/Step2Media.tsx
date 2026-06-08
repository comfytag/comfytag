'use client'

import React from 'react'
import { Button, ErrorMessage, MediaUploader } from '@comfytag/ui'
import { fieldGroupStyle, labelStyle, cardStyle } from '@/lib/formStyles'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface Step2MediaProps {
  formData: CreateEventFormData
  updateField: (field: keyof CreateEventFormData, value: unknown) => void
  handleUpload: (file: File) => Promise<string>
  stepErrors: string
  onNext: () => void
  onPrev: () => void
}

export function Step2Media({
  formData,
  updateField,
  handleUpload,
  stepErrors,
  onNext,
  onPrev,
}: Step2MediaProps) {
  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--color-text)' }}>
        Cover Image
      </h2>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Event Cover (16:9 aspect ratio)</label>
        <MediaUploader
          label="Event Cover"
          accept="image"
          urls={formData.coverImage ? [formData.coverImage] : []}
          onAdd={async newUrls => updateField('coverImage', newUrls[0] ?? '')}
          onRemove={() => updateField('coverImage', '')}
          uploadFn={handleUpload}
        />
      </div>

      {stepErrors && <ErrorMessage message={stepErrors} />}

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <Button variant="ghost" onClick={onPrev}>
          ← Back
        </Button>
        <Button variant="primary" onClick={onNext} fullWidth>
          Next: Ticket Tiers →
        </Button>
      </div>
    </div>
  )
}
