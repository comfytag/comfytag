'use client'

import React, { useContext } from 'react'
import { NotificationContext } from '@/contexts/NotificationContext'

interface NotificationBadgeProps {
  /**
   * Size of the badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Custom className to apply to badge
   */
  className?: string

  /**
   * Show badge even if count is 0
   * @default false
   */
  showWhenZero?: boolean

  /**
   * Maximum count to display (e.g., "9+" for counts > 9)
   * @default 99
   */
  maxCount?: number
}

/**
 * NotificationBadge - Real-time notification count badge
 * Displays unread notification count from global context
 * Updates in real-time via Socket.io
 *
 * @example
 * import { NotificationBadge } from '@/components/ui/NotificationBadge'
 *
 * export function Navbar() {
 *   return (
 *     <button className="relative">
 *       <BellIcon size={24} />
 *       <NotificationBadge size="md" />
 *     </button>
 *   )
 * }
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 'md',
  className,
  showWhenZero = false,
  maxCount = 99,
}) => {
  const { unreadCount } = useContext(NotificationContext)

  // Hide badge if count is 0 and showWhenZero is false
  if (unreadCount === 0 && !showWhenZero) {
    return null
  }

  // Format count: "99+" for counts > maxCount
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString()

  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  }

  return (
    <div
      className={`
        absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2
        ${sizeClasses[size]}
        bg-red-500 text-white rounded-full
        flex items-center justify-center font-semibold
        animation-pulse
        ${className || ''}
      `}
      aria-label={`${unreadCount} unread notifications`}
      role="status"
    >
      {displayCount}
    </div>
  )
}
