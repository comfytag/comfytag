'use client'

import React from 'react'

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  fullWidth?: boolean
  className?: string
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '13px' },
  md: { padding: '10px 18px', fontSize: '14px' },
  lg: { padding: '12px 24px', fontSize: '15px' },
}

const variantBase: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  primary: { backgroundColor: 'var(--color-brand)', color: 'var(--color-text-on-brand)', border: 'none' },
  ghost: { backgroundColor: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
  danger: { backgroundColor: 'var(--color-error)', color: 'var(--color-text-on-brand)', border: 'none' },
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  fullWidth = false,
  className,
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false)

  const isDisabled = disabled || loading

  const hoverOverride: React.CSSProperties = hovered && !isDisabled
    ? variant === 'primary'
      ? { backgroundColor: 'var(--color-brand-light)' }
      : variant === 'ghost'
      ? { backgroundColor: 'var(--color-surface-2)' }
      : { opacity: 0.85 }
    : {}

  const style: React.CSSProperties = {
    ...variantBase[variant],
    ...sizeStyles[size],
    ...hoverOverride,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : disabled ? 0.5 : 1,
    pointerEvents: disabled && !loading ? 'none' : undefined,
    transition: 'background-color 150ms ease, opacity 150ms ease',
    width: fullWidth ? '100%' : undefined,
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <>
      <style>{`.__ct_btn:focus-visible{outline:2px solid var(--color-brand);outline-offset:2px}`}</style>
      <button
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        className={`__ct_btn${className ? ` ${className}` : ''}`}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {loading && <SpinnerIcon />}
        {children}
      </button>
    </>
  )
}

function SpinnerIcon() {
  return (
    <>
      <style>{`@keyframes __ct_spin{100%{transform:rotate(360deg)}}`}</style>
      <span
        style={{
          display: 'inline-block',
          width: '14px',
          height: '14px',
          borderRadius: '9999px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: 'var(--color-text-on-brand)',
          animation: '__ct_spin 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
    </>
  )
}
