'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import type { Category } from '@comfytag/types'

interface CategoryPillsBarProps {
  categories: Category[]
  activeSlug?: string
  active?: string
  onSelect?: (slug: string) => void
}

export function CategoryPillsBar({ categories, activeSlug, active, onSelect }: CategoryPillsBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (categories.length === 0) return null

  // Support both activeSlug (Link-based) and active (callback-based) patterns
  const currentActive = active ?? activeSlug
  const isClickable = !!onSelect

  return (
    <>
      <style>{`
        .__ct_pills_wrap { position: sticky; top: 64px; z-index: 30; background: var(--color-bg); border-bottom: 1px solid var(--color-border); }
        .__ct_pills_inner { display: flex; align-items: center; gap: 8px; overflow-x: auto; padding: 10px 24px; scrollbar-width: none; -ms-overflow-style: none; mask-image: linear-gradient(to right, black 80%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%); }
        .__ct_pills_inner::-webkit-scrollbar { display: none; }
        .__ct_pills_item { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: var(--radius-full); font-size: 13px; font-weight: 600; text-decoration: none; transition: background 150ms ease, color 150ms ease, border-color 150ms ease, filter 150ms ease; white-space: nowrap; border: 1px solid transparent; }
        .__ct_pills_item:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }
        .__ct_pills_item.active { background: var(--color-brand); color: var(--color-text-on-brand); border-color: var(--color-brand); }
        .__ct_pills_item.inactive { background: var(--color-surface-2); color: var(--color-text); border-color: var(--color-border); }
        .__ct_pills_item.active:hover { filter: brightness(0.9); }
        .__ct_pills_item.inactive:hover { background: var(--color-surface); }
        @media (max-width: 767px) { .__ct_pills_wrap { top: 56px; } .__ct_pills_inner { padding: 10px 16px; } }
      `}</style>

      <div className="__ct_pills_wrap">
        <div className="__ct_pills_inner" ref={scrollRef}>
          {/* "All" pill */}
          {isClickable ? (
            <button
              type="button"
              className={`__ct_pills_item ${!currentActive ? 'active' : 'inactive'}`}
              onClick={() => onSelect?.('')}
            >
              All Events
            </button>
          ) : (
            <Link
              href="/"
              className={`__ct_pills_item ${!currentActive ? 'active' : 'inactive'}`}
            >
              All Events
            </Link>
          )}

          {categories.map((cat) => {
            const isActive = currentActive === (cat.slug ?? cat._id)
            const className = `__ct_pills_item ${isActive ? 'active' : 'inactive'}`

            return isClickable ? (
              <button
                key={cat._id}
                type="button"
                className={className}
                onClick={() => onSelect?.(cat.slug ?? cat._id)}
              >
                {cat.icon && <span aria-hidden="true" style={{ fontSize: '14px' }}>{cat.icon}</span>}
                {cat.title}
              </button>
            ) : (
              <Link
                key={cat._id}
                href={`/category/${cat.slug ?? cat._id}`}
                className={className}
              >
                {cat.icon && <span aria-hidden="true" style={{ fontSize: '14px' }}>{cat.icon}</span>}
                {cat.title}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
