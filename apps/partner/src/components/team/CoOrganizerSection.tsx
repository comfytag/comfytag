'use client'

import { Button, EmptyState } from '@comfytag/ui'

export function CoOrganizerSection() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px 0' }}>
          Co-organizers
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
          Collaborate with teammates on events.
        </p>
      </div>

      {/* Empty state */}
      <EmptyState
        title="No co-organizers yet"
        subtitle="Invite team members to collaborate on your events."
      />

      {/* Invite button */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button
          disabled
          variant="ghost"
          fullWidth
        >
          Invite Co-organizer
        </Button>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Coming Soon
        </span>
      </div>
    </div>
  )
}
