import React from 'react'
import { initials } from '@comfytag/utils'

export interface AvatarInitialsProps {
  name: string
  src?: string
  size?: number
  fontSize?: number
  className?: string
}

export function AvatarInitials({
  name,
  src,
  size = 40,
  fontSize,
  className,
}: AvatarInitialsProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
    )
  }

  const fontSizeValue = fontSize ?? Math.max(12, Math.floor(size / 3))

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--color-brand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: fontSizeValue,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </span>
  )
}
