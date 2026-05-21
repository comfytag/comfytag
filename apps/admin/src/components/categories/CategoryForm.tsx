'use client'

import { Input } from '@comfytag/ui'

export interface CategoryFormValues {
  title: string
  icon: string
  gradient: string
  description: string
  sortOrder: string
  isActive: boolean
}

interface CategoryFormProps {
  form: CategoryFormValues
  onChange: (updates: Partial<CategoryFormValues>) => void
}

export function CategoryForm({ form, onChange }: CategoryFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        label="Category Name"
        value={form.title}
        onChange={(e) => onChange({ title: e.target.value })}
        required
      />
      <Input
        label="Icon (emoji)"
        value={form.icon}
        onChange={(e) => onChange({ icon: e.target.value })}
        placeholder="🎵"
      />
      <div>
        <Input
          label="CSS Gradient"
          value={form.gradient}
          onChange={(e) => onChange({ gradient: e.target.value })}
          placeholder="linear-gradient(135deg, #7C3AED, #8B5CF6)"
        />
        <div
          style={{
            background: form.gradient || 'var(--color-surface-2)',
            height: 32,
            borderRadius: 8,
            marginTop: 4,
          }}
        />
      </div>
      <Input
        label="Description"
        value={form.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Optional"
      />
      <Input
        label="Sort Order"
        type="number"
        value={form.sortOrder}
        onChange={(e) => onChange({ sortOrder: e.target.value })}
        placeholder="0"
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-2)',
        }}
      >
        <span style={{ fontSize: 14, color: 'var(--color-text)', fontWeight: 500 }}>Active</span>
        <button
          type="button"
          onClick={() => onChange({ isActive: !form.isActive })}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: form.isActive ? 'var(--color-brand)' : 'var(--color-border)',
            position: 'relative',
            transition: 'background-color 0.2s ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: form.isActive ? 22 : 2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'var(--color-text)',
              transition: 'left 0.2s ease',
            }}
          />
        </button>
      </div>
    </div>
  )
}
