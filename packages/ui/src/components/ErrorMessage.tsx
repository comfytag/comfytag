import React from 'react'

export interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(239,68,68,0.2)',
      }}
    >
      <span style={{ color: 'var(--color-error)', fontSize: '16px', flexShrink: 0 }}>⚠</span>
      <span style={{ fontSize: '14px', color: 'var(--color-error)' }}>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-brand)',
            cursor: 'pointer',
            fontSize: '13px',
            padding: 0,
            marginLeft: '8px',
            textDecoration: 'underline',
            flexShrink: 0,
          }}
        >
          Try again
        </button>
      )}
    </div>
  )
}
