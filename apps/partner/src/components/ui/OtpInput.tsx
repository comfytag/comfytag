'use client'

import React, { useRef } from 'react'

interface OtpInputProps {
  length?: number
  value: string[]
  onChange: (value: string[]) => void
  onComplete?: (otp: string) => void
}

export function OtpInput({ length = 6, value, onChange, onComplete }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(length).fill(null))

  function handleChange(index: number, inputValue: string) {
    const char = inputValue.replace(/[^0-9a-zA-Z]/g, '').slice(-1)
    const updated = [...value]
    updated[index] = char
    onChange(updated)

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    if (char && index === length - 1 && onComplete) {
      const completed = [...updated]
      if (completed.every((d) => d !== '')) {
        onComplete(completed.join(''))
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          style={{
            width: '44px',
            height: '52px',
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
            fontSize: '20px',
            borderRadius: '8px',
            color: 'var(--color-text)',
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        />
      ))}
    </div>
  )
}
