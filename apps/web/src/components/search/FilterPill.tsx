export interface FilterPillProps {
  label: string
  active: boolean
  onClick: () => void
}

export function FilterPill({ label, active, onClick }: FilterPillProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 'var(--radius-full)',
        border: active ? '1.5px solid var(--color-brand)' : `1.5px solid var(--color-border)`,
        background: active ? 'var(--color-brand)' : `var(--color-surface-2)`,
        color: active ? 'var(--color-text-on-brand)' : 'var(--color-text)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        transition: `all var(--duration-fast)`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}
