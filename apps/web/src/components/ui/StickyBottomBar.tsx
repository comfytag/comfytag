'use client'

import React from 'react'

export interface StickyBottomBarProps {
  children: React.ReactNode
  hidden?: boolean
  isVisible?: boolean
}

export function StickyBottomBar({ children, hidden = false, isVisible }: StickyBottomBarProps) {
  const shouldHide = isVisible === undefined ? hidden : !isVisible
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'var(--color-surface)',
        borderTop: `1px solid var(--color-border)`,
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        transform: shouldHide ? 'translateY(100%)' : 'translateY(0)',
        transition: `transform var(--duration-default) var(--ease-standard)`,
        maxWidth: '480px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {children}
    </div>
  )
}
