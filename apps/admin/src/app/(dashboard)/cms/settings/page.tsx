'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner, ErrorMessage, Input, Button, PageHeader } from '@comfytag/ui'
import { useSiteConfig, useUpdateSiteConfig } from '@/hooks'

// ─── Local types ─────────────────────────────────────────
interface FormState {
  supportEmail: string
  heroHeadline: string
  heroSubtitle: string
  statAttendees: string
  statEvents: string
  statCities: string
}

const DEFAULT_FORM: FormState = {
  supportEmail: '',
  heroHeadline: '',
  heroSubtitle: '',
  statAttendees: '',
  statEvents: '',
  statCities: '',
}

// ─── Card layout helpers ──────────────────────────────────
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
export default function CmsSettingsPage() {
  const { data, isLoading, isError } = useSiteConfig()
  const updateMutation = useUpdateSiteConfig()

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [success, setSuccess] = useState(false)

  // Hydrate form once remote config loads
  useEffect(() => {
    if (!data) return
    setForm({
      supportEmail: data.supportEmail ?? '',
      heroHeadline: data.heroHeadline ?? '',
      heroSubtitle: data.heroSubtitle ?? '',
      statAttendees: data.statAttendees ?? '',
      statEvents:   data.statEvents   ?? '',
      statCities:   data.statCities   ?? '',
    })
  }, [data])

  // Auto-dismiss success flash after 3 s
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [success])

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSave() {
    updateMutation.mutate(form, {
      onSuccess: () => setSuccess(true),
    })
  }

  if (isLoading) return <LoadingSpinner size="lg" centered />
  if (isError)   return <ErrorMessage message="Failed to load site configuration" />

  return (
    <div style={{ maxWidth: '680px' }}>
      <PageHeader
        title="Site Settings"
        subtitle="Global variables rendered on the public attendee site"
      />

      {/* ── Support ──────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeadingStyle}>Support</div>
        <Input
          id="cms-support-email"
          label="Support email"
          type="email"
          value={form.supportEmail}
          onChange={(e) => set('supportEmail', e.target.value)}
        />
      </div>

      {/* ── Hero Section ──────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeadingStyle}>Hero Section</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            id="cms-hero-headline"
            label="Headline"
            value={form.heroHeadline}
            onChange={(e) => set('heroHeadline', e.target.value)}
          />
          <Input
            id="cms-hero-subtitle"
            label="Subtitle"
            value={form.heroSubtitle}
            onChange={(e) => set('heroSubtitle', e.target.value)}
          />
        </div>
      </div>

      {/* ── Social Proof Stats ────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeadingStyle}>Social Proof Stats</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            id="cms-stat-attendees"
            label="Attendees (e.g. 50,000+)"
            value={form.statAttendees}
            onChange={(e) => set('statAttendees', e.target.value)}
          />
          <Input
            id="cms-stat-events"
            label="Events (e.g. 1,200+)"
            value={form.statEvents}
            onChange={(e) => set('statEvents', e.target.value)}
          />
          <Input
            id="cms-stat-cities"
            label="Cities (e.g. 12)"
            value={form.statCities}
            onChange={(e) => set('statCities', e.target.value)}
          />
        </div>
      </div>

      {/* ── Save ─────────────────────────────────────── */}
      <div>
        {success && (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-success)',
              marginBottom: '12px',
            }}
          >
            Site settings saved successfully
          </p>
        )}
        {updateMutation.isError && (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-error)',
              marginBottom: '12px',
            }}
          >
            Failed to save. Please try again.
          </p>
        )}
        <Button
          variant="primary"
          loading={updateMutation.isPending}
          onClick={() => void handleSave()}
        >
          Save changes
        </Button>
      </div>
    </div>
  )
}
