'use client'

import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

// ---------------------------------------------------------------------------
// Component — Light Studio Minimalist card container
// ---------------------------------------------------------------------------

export function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div
      className={`bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden flex flex-col ${className}`}
    >
      <div className="px-5 pt-5 pb-4 border-b border-zinc-800">
        <h3 className="text-sm font-bold text-(--color-text) leading-snug">{title}</h3>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </div>
  )
}
