'use client'

import React from 'react'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  placeholder = 'Search events, venues, organizers…',
  autoFocus = false,
  className,
}: SearchInputProps) {
  const [focused, setFocused] = React.useState(false)

  return (
    <>
      <style>{`
        .__ct_searchinput::placeholder { color: var(--color-text-muted); }
        .__ct_searchinput::-webkit-search-cancel-button { display: none; }
      `}</style>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
        className={className}
      >
        {/* Search icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: 'absolute',
            left: '12px',
            pointerEvents: 'none',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>

        {/* Input */}
        <input
          type="search"
          className="__ct_searchinput"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch?.(value)
          }}
          onFocus={() => { setFocused(true); onFocusProp?.() }}
          onBlur={() => { setFocused(false); onBlurProp?.() }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{
            width: '100%',
            padding: '12px 40px',
            border: `1.5px solid ${focused ? 'var(--color-brand)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surface)',
            fontSize: '15px',
            outline: 'none',
            color: 'var(--color-text)',
            transition: `border-color var(--duration-fast) var(--ease-standard)`,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
        />

        {/* Clear button */}
        {value !== '' && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-muted)',
              transition: `color var(--duration-fast) var(--ease-standard)`,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </>
  )
}
