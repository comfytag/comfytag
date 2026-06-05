import React from 'react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  centered?: boolean
  className?: string
}

const sizePx: Record<NonNullable<LoadingSpinnerProps['size']>, number> = {
  sm: 16,
  md: 24,
  lg: 40,
}

export function LoadingSpinner({ size = 'md', centered = false, className }: LoadingSpinnerProps) {
  const px = sizePx[size]

  const spinner = (
    <>
      <style>{`@keyframes __ct_spin{100%{transform:rotate(360deg)}}`}</style>
      <div
        className={centered ? undefined : className}
        suppressHydrationWarning
        style={{
          width: px,
          height: px,
          borderRadius: '9999px',
          border: '2px solid var(--color-border)',
          borderTopColor: 'var(--color-brand)',
          animation: '__ct_spin 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
    </>
  )

  if (centered) {
    return (
      <div
        className={className}
        suppressHydrationWarning
        style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}
      >
        {spinner}
      </div>
    )
  }

  return spinner
}
