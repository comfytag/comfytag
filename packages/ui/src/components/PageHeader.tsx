import React from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  align?: 'start' | 'center'
  titleSize?: 'md' | 'lg'
}

export function PageHeader({
  title,
  subtitle,
  action,
  align = 'start',
  titleSize = 'md',
}: PageHeaderProps) {
  const titleFontSize = titleSize === 'lg' ? '24px' : '22px'
  const marginBottom = titleSize === 'lg' ? '24px' : '28px'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : 'space-between',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        marginBottom,
        flexWrap: 'wrap',
        gap: '12px',
        textAlign: align === 'center' ? 'center' : 'left',
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-anybody), sans-serif', // NEW: Bold Anybody font
            fontSize: titleFontSize,
            fontWeight: 800,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontFamily: 'var(--font-label), sans-serif', // NEW: Space Grotesk labels
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              marginTop: '6px',
              marginBottom: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
