'use client'

import { useEffect, useState } from 'react'
import { Button, ErrorMessage, Input, LoadingSpinner, PageHeader } from '@comfytag/ui'
import type { LegalSection } from '@comfytag/types'
import { Plus, Trash2 } from 'lucide-react'
import { useLegalDocument, useUpsertLegalDocument } from '@/hooks'

// ─── Shared styles ───────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
  marginBottom: '24px',
}

const sectionBorderStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px',
  marginBottom: '12px',
  backgroundColor: 'color-mix(in srgb, var(--color-surface-2) 60%, transparent)',
}

type DocType = 'terms' | 'privacy'

// ─── Section list editor ─────────────────────────────────
function SectionsEditor({
  sections,
  onChange,
}: {
  sections: LegalSection[]
  onChange: (sections: LegalSection[]) => void
}) {
  function updateSection(index: number, field: keyof LegalSection, value: string) {
    const next = sections.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    onChange(next)
  }

  function addSection() {
    onChange([...sections, { heading: '', body: '' }])
  }

  function removeSection(index: number) {
    onChange(sections.filter((_, i) => i !== index))
  }

  return (
    <div>
      {sections.map((section, i) => (
        <div key={i} style={sectionBorderStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Section {i + 1}
            </span>
            <button
              title="Remove section"
              onClick={() => removeSection(i)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-error)',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Input
              id={`section-heading-${i}`}
              label="Heading"
              value={section.heading}
              onChange={(e) => updateSection(i, 'heading', e.target.value)}
            />
            <div>
              <label
                htmlFor={`section-body-${i}`}
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  marginBottom: '6px',
                }}
              >
                Body
              </label>
              <textarea
                id={`section-body-${i}`}
                value={section.body}
                rows={5}
                onChange={(e) => updateSection(i, 'body', e.target.value)}
                placeholder="Enter section content…"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addSection}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-text-muted)',
          fontSize: '13px',
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Plus size={14} />
        Add section
      </button>
    </div>
  )
}

// ─── Single document editor panel ───────────────────────
function LegalDocEditor({ docType, label }: { docType: DocType; label: string }) {
  const { data, isLoading, isError } = useLegalDocument(docType)
  const upsertMutation = useUpsertLegalDocument(docType)

  const [lastUpdated, setLastUpdated] = useState('')
  const [version,     setVersion]     = useState('')
  const [sections,    setSections]    = useState<LegalSection[]>([])
  const [success,     setSuccess]     = useState(false)

  useEffect(() => {
    if (!data) return
    setLastUpdated(data.lastUpdated ?? '')
    setVersion(data.version ?? '')
    setSections(data.sections ?? [])
  }, [data])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [success])

  function handleSave() {
    if (!lastUpdated.trim()) return
    upsertMutation.mutate(
      { lastUpdated: lastUpdated.trim(), version: version.trim() || undefined, sections },
      { onSuccess: () => setSuccess(true) },
    )
  }

  if (isLoading) return <LoadingSpinner size="sm" centered />
  if (isError)   return <ErrorMessage message={`Failed to load ${label}`} />

  return (
    <div style={cardStyle}>
      <h2
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '20px',
        }}
      >
        {label}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Input
              id={`${docType}-last-updated`}
              label="Last updated (displayed to users)"
              value={lastUpdated}
              onChange={(e) => setLastUpdated(e.target.value)}
              placeholder="e.g. January 1, 2026"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              id={`${docType}-version`}
              label="Version (optional)"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. v2.1"
            />
          </div>
        </div>

        <div>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text)',
              marginBottom: '12px',
            }}
          >
            Sections
          </p>
          <SectionsEditor sections={sections} onChange={setSections} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button
          variant="primary"
          loading={upsertMutation.isPending}
          onClick={handleSave}
        >
          Save {label}
        </Button>
        {success && (
          <span style={{ fontSize: '13px', color: 'var(--color-success)' }}>
            Saved successfully
          </span>
        )}
        {upsertMutation.isError && (
          <span style={{ fontSize: '13px', color: 'var(--color-error)' }}>
            Failed to save. Please try again.
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Tab bar ─────────────────────────────────────────────
const TABS: { key: DocType; label: string }[] = [
  { key: 'terms',   label: 'Terms & Conditions' },
  { key: 'privacy', label: 'Privacy Policy'     },
]

// ─── Page ────────────────────────────────────────────────
export default function CmsLegalPage() {
  const [activeTab, setActiveTab] = useState<DocType>('terms')

  return (
    <div style={{ maxWidth: '800px' }}>
      <PageHeader
        title="Legal Documents"
        subtitle="Manage Terms & Conditions and Privacy Policy displayed on the site"
      />

      {/* ── Tab bar ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                color: isActive ? 'var(--color-brand)' : 'var(--color-text-muted)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                borderBottom: isActive
                  ? '2px solid var(--color-brand)'
                  : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'terms'   && <LegalDocEditor docType="terms"   label="Terms & Conditions" />}
      {activeTab === 'privacy' && <LegalDocEditor docType="privacy" label="Privacy Policy"     />}
    </div>
  )
}
