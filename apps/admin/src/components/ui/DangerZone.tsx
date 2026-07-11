'use client'

interface DangerZoneProps {
  description: string
  actionLabel: string
  onAction: () => void
  loading?: boolean
}

export function DangerZone({
  description,
  actionLabel,
  onAction,
  loading = false,
}: DangerZoneProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--color-error)',
          marginBottom: 8,
        }}
      >
        Danger Zone
      </div>
      <div
        style={{
          fontSize: 14,
          color: 'var(--color-text-muted)',
          marginBottom: 16,
        }}
      >
        {description}
      </div>
      <button
        onClick={onAction}
        disabled={loading}
        style={{
          padding: '10px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-error)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 600,
          backgroundColor: 'transparent',
          color: 'var(--color-error)',
          opacity: loading ? 0.6 : 1,
          transition: 'opacity var(--duration-micro) var(--ease-standard)',
        }}
      >
        {loading ? 'Processing...' : actionLabel}
      </button>
    </div>
  )
}
