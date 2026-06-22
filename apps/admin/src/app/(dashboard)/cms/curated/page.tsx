'use client'

import { useEffect, useState } from 'react'
import { Button, ErrorMessage, Input, LoadingSpinner, PageHeader } from '@comfytag/ui'
import { useCuratedSection, useUpdateCuratedSection } from '@/hooks'

// ─── Toggle switch (shared pattern from how-it-works page) ─
function ToggleSwitch({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
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
          borderRadius: 10,
          backgroundColor: checked ? 'var(--color-brand)' : 'var(--color-border)',
          transition: 'background-color 0.2s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#fff',
            transition: 'left 0.2s',
          }}
        />
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
      </span>
      <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>{label}</span>
    </label>
  )
}

// ─── Card styles (consistent with cms/settings/page.tsx) ──
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
}

const cardHeadingStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: '20px',
}

// ─── Page ─────────────────────────────────────────────────
const SECTION_KEY = 'editor_picks'

export default function CmsCuratedPage() {
  const { data, isLoading, isError } = useCuratedSection(SECTION_KEY)
  const updateMutation = useUpdateCuratedSection(SECTION_KEY)

  const [title,    setTitle]    = useState('')
  const [eyebrow,  setEyebrow]  = useState('')
  const [isActive, setIsActive] = useState(true)
  const [success,  setSuccess]  = useState(false)

  // Hydrate local state once remote data arrives
  useEffect(() => {
    if (!data) return
    setTitle(data.title    ?? '')
    setEyebrow(data.eyebrow ?? '')
    setIsActive(data.isActive ?? true)
  }, [data])

  // Auto-dismiss success flash
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [success])

  function handleSave() {
    updateMutation.mutate(
      { title: title.trim(), eyebrow: eyebrow.trim(), isActive },
      { onSuccess: () => setSuccess(true) },
    )
  }

  if (isLoading) return <LoadingSpinner size="lg" centered />

  // The /cms/curated-sections endpoint is not yet implemented on the backend.
  // Render a degraded form so the page loads without crashing; admins will see
  // empty fields and can submit once the backend route is deployed.
  const isPending = isLoading && !isError

  return (
    <div style={{ maxWidth: '680px' }}>
      <PageHeader
        title="Curated Sections"
        subtitle="Manage the Editor's Picks section displayed on the attendee home page"
      />

      {isError && (
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: '13px',
            color: 'var(--color-error)',
          }}
        >
          Could not fetch section data — the <code>/cms/curated-sections/editor_picks</code> endpoint
          is not yet implemented on the backend. You can still submit updates below and they will
          take effect once the route is deployed.
        </div>
      )}

      {/* ── Editor's Picks Card ─────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeadingStyle}>Editor&apos;s Picks</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            id="curated-eyebrow"
            label="Eyebrow label (small text above headline)"
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
          />
          <Input
            id="curated-title"
            label="Section title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <ToggleSwitch
            id="curated-is-active"
            label="Show section on site"
            checked={isActive}
            onChange={setIsActive}
          />
        </div>
      </div>

      {/* ── Save ────────────────────────────────────── */}
      <div>
        {success && (
          <p style={{ fontSize: '14px', color: 'var(--color-success)', marginBottom: 12 }}>
            Section settings saved successfully
          </p>
        )}
        {updateMutation.isError && (
          <p style={{ fontSize: '14px', color: 'var(--color-error)', marginBottom: 12 }}>
            Failed to save. Please try again.
          </p>
        )}
        <Button
          variant="primary"
          loading={updateMutation.isPending || isPending}
          onClick={() => void handleSave()}
        >
          Save changes
        </Button>
      </div>
    </div>
  )
}
