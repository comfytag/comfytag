import React from 'react'

export interface EmptyStateProps {
  title: string
  subtitle?: string
  action?: { label: string; href: string }
  className?: string
}

export function EmptyState({ title, subtitle, action, className }: EmptyStateProps) {
  return (
    <>
      <style>{`@keyframes __ct_empty_fade_in{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
      @media (prefers-reduced-motion: reduce){.__ct_empty_fade_in{animation:none!important}}`}</style>
      <div
        className={`__ct_empty_fade_in${className ? ` ${className}` : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 24px',
          textAlign: 'center',
          animation: '__ct_empty_fade_in var(--duration-entrance) var(--ease-entrance)',
        }}
      >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth="2"
        style={{ marginBottom: '16px' }}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>

      <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
        {title}
      </span>

      {subtitle && (
        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
          {subtitle}
        </span>
      )}

      {action && (
        <a
          href={action.href}
          style={{
            marginTop: '20px',
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-brand)',
            color: 'var(--color-text-on-brand)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background-color var(--duration-micro) var(--ease-standard)',
          }}
        >
          {action.label}
        </a>
      )}
      </div>
    </>
  )
}
