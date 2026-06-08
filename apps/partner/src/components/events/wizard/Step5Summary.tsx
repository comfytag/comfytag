'use client'

import React from 'react'
import { Edit2 } from 'lucide-react'
import { Button, ErrorMessage } from '@comfytag/ui'
import { formatDate, formatTime, formatNaira } from '@comfytag/utils'
import { cardStyle } from '@/lib/formStyles'
import type { CreateEventFormData } from '@/hooks/useCreateEventWizard'

interface SummaryFieldProps {
  title: string
  step: 1 | 2 | 3 | 4 | 5
  onClick: () => void
  children: React.ReactNode
}

function SummaryField({ title, onClick, children }: SummaryFieldProps) {
  return (
    <div
      style={{
        background: 'var(--color-bg)',
        borderRadius: '8px',
        padding: '12px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', margin: 0 }}>
          {title}
        </h5>
        <button
          type="button"
          onClick={onClick}
          aria-label={`Edit ${title}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'var(--color-text-muted)',
            transition: 'color var(--duration-fast) ease',
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.color = 'var(--color-brand)'
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.color = 'var(--color-text-muted)'
          }}
        >
          <Edit2 size={14} />
        </button>
      </div>
      {children}
    </div>
  )
}

interface Step5SummaryProps {
  formData: CreateEventFormData
  stepErrors: string
  onGoToStep: (step: 1 | 2 | 3 | 4 | 5) => void
  onSubmit: (status: 'draft' | 'published') => void
  isPending: boolean
  onPrev: () => void
}

export function Step5Summary({
  formData,
  stepErrors,
  onGoToStep,
  onSubmit,
  isPending,
  onPrev,
}: Step5SummaryProps) {
  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 24px 0', color: 'var(--color-text)' }}>
        Review & Publish
      </h2>

      {/* Live Preview */}
      <div
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '28px',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px 0' }}>
          Event Preview
        </h3>

        {/* Cover + Info */}
        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          {formData.coverImage && (
            <div style={{ width: '100%', height: '200px', position: 'relative', overflow: 'hidden' }}>
              <img
                src={formData.coverImage}
                alt={formData.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          <div style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
              {formData.name || 'Event Name'}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              {formData.date && formData.startTime
                ? `${formatDate(formData.date)} at ${formatTime(formData.startTime)}`
                : 'Date & time'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              {formData.venue || 'Venue'} • {formData.state || 'State'}
            </p>
          </div>
        </div>

        {/* Summary Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Description */}
          <SummaryField
            title="Description"
            step={4}
            onClick={() => onGoToStep(4)}
          >
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              {formData.description || 'Add description...'}
            </p>
          </SummaryField>

          {/* Tickets */}
          <SummaryField
            title={`Tickets (${formData.tiers.length})`}
            step={3}
            onClick={() => onGoToStep(3)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {formData.tiers.slice(0, 2).map((tier, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                  {tier.name} – {formatNaira(Number(tier.price))} (×{tier.capacity})
                </div>
              ))}
              {formData.tiers.length > 2 && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  +{formData.tiers.length - 2} more tier{formData.tiers.length - 2 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </SummaryField>

          {/* Performers */}
          <SummaryField
            title={`Lineup (${formData.performers.length})`}
            step={4}
            onClick={() => onGoToStep(4)}
          >
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {formData.performers.length > 0 ? (
                formData.performers.slice(0, 3).map((p, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '12px',
                      background: 'var(--color-brand)',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {p}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>None added</span>
              )}
            </div>
          </SummaryField>

          {/* Visibility */}
          <SummaryField
            title="Visibility"
            step={4}
            onClick={() => onGoToStep(4)}
          >
            <p style={{ fontSize: '13px', color: 'var(--color-text)', margin: 0 }}>
              {formData.details.isPublic ? '🌐 Public' : '🔒 Private'}
            </p>
          </SummaryField>
        </div>
      </div>

      {stepErrors && <ErrorMessage message={stepErrors} />}

      <div style={{ display: 'flex', gap: '12px' }}>
        <Button variant="ghost" onClick={onPrev}>
          ← Back
        </Button>
        <Button
          variant="ghost"
          loading={isPending}
          onClick={() => onSubmit('draft')}
        >
          Save as Draft
        </Button>
        <Button
          variant="primary"
          loading={isPending}
          onClick={() => onSubmit('published')}
          fullWidth
        >
          Publish Event
        </Button>
      </div>
    </div>
  )
}
