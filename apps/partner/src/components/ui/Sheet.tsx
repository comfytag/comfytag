'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children?: React.ReactNode
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 40,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 280ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '480px',
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e4e4e7',
          zIndex: 50,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--duration-entrance) var(--ease-entrance)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #e4e4e7',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#18181b', margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: '#f4f4f5',
              cursor: 'pointer',
              color: '#71717a',
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: '28px 24px', flex: 1, overflowY: 'auto' }}>
          {children ?? (
            <div style={{ textAlign: 'center', paddingTop: '48px' }}>
              <p style={{ fontSize: '14px', color: '#a1a1aa' }}>
                Edit form coming soon…
              </p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
