'use client'

import React, { useState } from 'react'

export interface TextareaProps {
  label?: string
  id?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
}

export function Textarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  error,
  required,
  disabled,
  rows = 4,
  className,
}: TextareaProps) {
  const [focused, setFocused] = useState(false)

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--color-surface-2)',
    border: `1px solid ${error ? 'var(--color-error)' : focused ? 'var(--color-brand)' : 'var(--color-border)'}`,
    color: 'var(--color-text)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    fontSize: '16px',
    outline: 'none',
    boxShadow: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '96px',
    transition: 'border-color 150ms ease',
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

      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        style={textareaStyle}
        className="focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }}>
          {error}
        </span>
      )}
    </div>
  )
}
