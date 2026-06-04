'use client'

import React, { useEffect } from 'react'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', handler)
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop — always in DOM, hidden via opacity + pointer-events */}
      <div
        aria-hidden={!isOpen}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--color-overlay)',
          zIndex: 100,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: `opacity var(--duration-entrance) var(--ease-standard)`,
        }}
      />

      {/* Sheet — always in DOM, animated via transform */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          background: 'var(--color-surface)',
          borderRadius: `var(--radius-lg) var(--radius-lg) 0 0`,
          maxHeight: '90vh',
          overflowY: 'auto',
          maxWidth: '480px',
          marginLeft: 'auto',
          marginRight: 'auto',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: `transform var(--duration-entrance) cubic-bezier(0.32, 0.72, 0, 1)`,
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: '36px',
            height: '4px',
            background: 'var(--color-border)',
            borderRadius: '2px',
            margin: '12px auto 8px',
          }}
          aria-hidden="true"
        />

        {/* Title */}
        {title && (
          <div
            style={{
              fontSize: '17px',
              fontWeight: 600,
              padding: '0 24px 16px',
              color: 'var(--color-text)',
            }}
          >
            {title}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '0 24px calc(32px + env(safe-area-inset-bottom))' }}>{children}</div>
      </div>
    </>
  )
}
