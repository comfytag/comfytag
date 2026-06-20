'use client'

import React, { useState } from 'react'

// ── SelectItem ──────────────────────────────────────────────────────────────

export interface SelectItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

export function SelectItem({ value, children, disabled }: SelectItemProps) {
  return (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  )
}

// ── Select (Trigger wrapper) ────────────────────────────────────────────────

export interface SelectProps {
  label?: string
  id?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function Select({
  label,
  id,
  value,
  onChange,
  children,
  error,
  required,
  disabled,
  className,
}: SelectProps) {
  const [focused, setFocused] = useState(false)

  const triggerStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--color-surface-2)',
    border: `1px solid ${error ? 'var(--color-error)' : focused ? 'var(--color-brand)' : 'var(--color-border)'}`,
    color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 36px 10px 14px',
    fontSize: '16px',
    minHeight: '48px',
    outline: 'none',
    boxShadow: 'none',
    boxSizing: 'border-box',
    appearance: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'border-color 150ms ease',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A8A29E' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column' }}>
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

      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        style={triggerStyle}
        className="focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {children}
      </select>

      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }}>
          {error}
        </span>
      )}
    </div>
  )
}
