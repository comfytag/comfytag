'use client'
import React, { useState } from 'react'

interface ViewToggleProps {
  view: 'list' | 'map'
  onChange: (v: 'list' | 'map') => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  const [hovered, setHovered] = useState<'list' | 'map' | null>(null)
  return (
    <>
      <style>{`
        .__ct_view_toggle { display: flex; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--color-border); }
        .__ct_view_toggle button { padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: background var(--duration-fast), color var(--duration-fast); }
      `}</style>
      <div className="__ct_view_toggle">
        {(['list', 'map'] as const).map((v) => {
          const isActive = view === v
          const isHovered = hovered === v && !isActive
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              onMouseEnter={() => setHovered(v)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isActive ? 'var(--color-brand)' : isHovered ? 'var(--color-surface)' : 'var(--color-surface-2)',
                color: isActive ? 'var(--color-text-on-brand)' : 'var(--color-text-muted)',
              }}
            >
              {v === 'list' ? 'List' : 'Map'}
            </button>
          )
        })}
      </div>
    </>
  )
}
