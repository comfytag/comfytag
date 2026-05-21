'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { formatNaira } from '@comfytag/utils'

interface TierListRowProps {
  name: string
  price: string | number
  capacity: string | number
  onRemove: () => void
  onEdit?: () => void
}

export function TierListRow({ name, price, capacity, onRemove, onEdit }: TierListRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 8px',
        borderBottom: '1px solid var(--color-border)',
        background: isHovered ? 'var(--color-surface-2)' : 'transparent',
        transition: 'background 150ms',
        borderRadius: '4px',
      }}
    >
      <div>
        <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{name}</div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          {formatNaira(Number(price))} · {capacity} spots
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              padding: '4px',
              fontSize: '12px',
              textDecoration: 'underline',
            }}
          >
            Edit
          </button>
        )}
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-error)',
            display: 'flex',
            padding: '4px',
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
