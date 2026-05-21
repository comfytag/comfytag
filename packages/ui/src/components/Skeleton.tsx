import React from 'react'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
}

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  className,
}: SkeletonProps) {
  return (
    <>
      <style>{`@keyframes __ct_pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div
        className={className}
        style={{
          width,
          height,
          borderRadius,
          backgroundColor: 'var(--color-surface-2)',
          animation: '__ct_pulse 1.5s ease-in-out infinite',
        }}
      />
    </>
  )
}
