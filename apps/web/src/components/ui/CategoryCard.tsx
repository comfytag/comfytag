'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import type { Category } from '@comfytag/types'

export interface CategoryCardProps {
  name?: string
  icon?: ReactNode
  gradient?: string
  onClick?: () => void
  category?: Category
  href?: string
}

export function CategoryCard({ name, icon, gradient, onClick, category, href }: CategoryCardProps) {
  const router = useRouter()
  const [hovered, setHovered] = React.useState(false)

  const displayName = name ?? category?.title ?? ''
  const displayIcon = icon ?? category?.icon ?? '🎫'
  const background =
    gradient ??
    'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)'

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <>
      <style>{`
        .__ct_catcard { text-decoration: none; display: block; }
        .__ct_catcard:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; border-radius: var(--radius-md); }
      `}</style>
      <div
        className="__ct_catcard"
        role={onClick || href ? 'button' : undefined}
        tabIndex={onClick || href ? 0 : undefined}
        onKeyDown={(e) => {
          if ((onClick || href) && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleClick()
          }
        }}
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          height: '100px',
          width: '100%',
          background,
          display: 'block',
          border: hovered ? '1px solid var(--color-brand)' : '1px solid transparent',
          transition: `border-color var(--duration-micro) var(--ease-standard)`,
          cursor: onClick || href ? 'pointer' : 'default',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
      >
        {/* Icon — top right, faded */}
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '8px',
            fontSize: '40px',
            opacity: 0.25,
            lineHeight: 1,
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          {displayIcon}
        </div>

        {/* Category name — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            padding: '12px 16px',
            color: 'var(--color-text-on-brand)',
            fontSize: '15px',
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {displayName}
        </div>
      </div>
    </>
  )
}
