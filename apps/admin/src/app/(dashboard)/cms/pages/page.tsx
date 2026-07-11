'use client'

import { useEffect, useState } from 'react'
import { Button, ErrorMessage, Input, LoadingSpinner, PageHeader } from '@comfytag/ui'
import type { PageSection } from '@comfytag/types'
import { Plus, Trash2 } from 'lucide-react'
import { usePageContent, useUpsertPageContent } from '@/hooks'

// ─── Styles ──────────────────────────────────────────────
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

// ─── Section list editor ─────────────────────────────────
function PageSectionsEditor({
  sections,
  onChange,
}: {
  sections: PageSection[]
  onChange: (sections: PageSection[]) => void
}) {
  function updateSection(index: number, field: keyof PageSection, value: string) {
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
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
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
              id={`page-section-heading-${i}`}
              label="Heading (optional)"
              value={section.heading ?? ''}
              onChange={(e) => updateSection(i, 'heading', e.target.value)}
            />
            <div>
              <label
                htmlFor={`page-section-body-${i}`}
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
                id={`page-section-body-${i}`}
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

// ─── Page ────────────────────────────────────────────────
const PAGE_KEY = 'about'

export default function CmsPagesPage() {
  const { data, isLoading, isError } = usePageContent(PAGE_KEY)
  const upsertMutation = useUpsertPageContent(PAGE_KEY)

  const [title,       setTitle]       = useState('')
  const [sections,    setSections]    = useState<PageSection[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [success,     setSuccess]     = useState(false)

  useEffect(() => {
    if (!data) return
    setTitle(data.title ?? '')
    setSections(data.sections ?? [])
    setIsPublished(data.isPublished ?? false)
  }, [data])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [success])

  function handleSave() {
    upsertMutation.mutate(
      { title: title.trim() || undefined, sections, isPublished },
      { onSuccess: () => setSuccess(true) },
    )
  }

  if (isLoading) return <LoadingSpinner size="lg" centered />
  if (isError)   return <ErrorMessage message="Failed to load page content" />

  return (
    <div style={{ maxWidth: '800px' }}>
      <PageHeader
        title="Static Pages"
        subtitle="Manage static page content displayed on the attendee site"
      />

      {/* ── About page card ──────────────────────────── */}
      <div style={cardStyle}>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '20px',
          }}
        >
          About Page
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            id="page-title"
            label="Page title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. About ComfyTag"
          />

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
            <PageSectionsEditor sections={sections} onChange={setSections} />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                width: 36,
                height: 20,
                borderRadius: 'var(--radius-xl)',
                backgroundColor: isPublished ? 'var(--color-brand)' : 'var(--color-border)',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: isPublished ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  transition: 'left 0.2s',
                }}
              />
              <input
                id="page-published"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
            </span>
            <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
              Published (visible on attendee site)
            </span>
          </label>
        </div>
      </div>

      {/* ── Save ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button
          variant="primary"
          loading={upsertMutation.isPending}
          onClick={handleSave}
        >
          Save changes
        </Button>
        {success && (
          <span style={{ fontSize: '13px', color: 'var(--color-success)' }}>
            Page saved successfully
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
