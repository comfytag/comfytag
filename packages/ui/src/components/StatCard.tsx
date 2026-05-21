import React from 'react'
import { Skeleton } from './Skeleton'

export interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  value: string | number
  label: string
  isLoading?: boolean
}

export function StatCard({ icon: Icon, value, label, isLoading }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <div>
        {isLoading ? (
          <Skeleton width={60} height={14} />
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            {label}
          </div>
        )}
        {isLoading ? (
          <div style={{ marginTop: '8px' }}>
            <Skeleton width={80} height={28} />
          </div>
        ) : (
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>
            {value}
          </div>
        )}
      </div>

      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'var(--color-surface-2)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-brand)',
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
    </div>
  )
}
