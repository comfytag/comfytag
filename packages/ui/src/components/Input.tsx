'use client'

import React, { useState } from 'react'

export interface InputProps {
  label?: string
  id?: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  leftIcon?: React.ReactNode
  className?: string
}

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" />
  </svg>
)

const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
  </svg>
)

export function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required,
  disabled,
  leftIcon,
  className,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)

  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--color-surface-2)',
    border: `1px solid ${error ? 'var(--color-error)' : focused ? 'var(--color-brand)' : 'var(--color-border)'}`,
    color: 'var(--color-text)',
    borderRadius: 'var(--radius-md)',
    padding: `10px ${isPassword ? '44px' : '14px'} 10px ${leftIcon ? '40px' : '14px'}`,
    fontSize: '16px',
    minHeight: '48px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 150ms ease',
  }

  return (
    <div suppressHydrationWarning className={className} style={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '14px',
            color: 'var(--color-text)',
            fontWeight: 600,
            marginBottom: '6px',
            display: 'block',
          }}
        >
          {label}
        </label>
      )}

      <div suppressHydrationWarning style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
            tabIndex={-1}
          >
            {showPassword ? <EyeClosed /> : <EyeOpen />}
          </button>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }}>
          {error}
        </span>
      )}
    </div>
  )
}
