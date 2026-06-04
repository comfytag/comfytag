'use client'
import { AvatarInitials } from '@comfytag/ui'

interface ProfileCoverHeaderProps {
  name: string
  avatar?: string
  coverImage?: string
}

export function ProfileCoverHeader({ name, avatar, coverImage }: ProfileCoverHeaderProps) {
  return (
    <div
      className="relative w-full rounded-lg"
      style={{
        height: 200,
        background: coverImage
          ? `url('${coverImage}') center/cover no-repeat`
          : 'var(--color-surface-2)',
        overflow: 'visible',
      }}
    >
      <div className="absolute" style={{ left: 24, bottom: -40 }}>
        <AvatarInitials name={name} src={avatar} size={80} />
      </div>
    </div>
  )
}
