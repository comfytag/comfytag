import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'

export interface FullScreenLoaderProps {
  message?: string
}

export function FullScreenLoader({ message }: FullScreenLoaderProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <LoadingSpinner size="lg" />
      {message && (
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
          {message}
        </p>
      )}
    </div>
  )
}
