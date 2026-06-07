'use client'

import React, { createContext, useState, useCallback, ReactNode } from 'react'

interface NotificationContextType {
  unreadCount: number
  setUnreadCount: (count: number) => void
  incrementUnreadCount: () => void
  decrementUnreadCount: () => void
  resetUnreadCount: () => void
}

/**
 * NotificationContext - Global state for notification unread count
 * Avoids prop drilling across the entire app
 * Used by: NotificationBadge, useNotificationSocket
 */
export const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  incrementUnreadCount: () => {},
  decrementUnreadCount: () => {},
  resetUnreadCount: () => {},
})

interface NotificationProviderProps {
  children: ReactNode
}

/**
 * NotificationProvider - Wrap app root with this provider
 * Typically in: apps/web/src/app/layout.tsx
 *
 * @example
 * export default function RootLayout({ children }) {
 *   return (
 *     <NotificationProvider>
 *       {children}
 *     </NotificationProvider>
 *   )
 * }
 */
export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [unreadCount, setUnreadCount] = useState(0)

  const incrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => prev + 1)
  }, [])

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0)
  }, [])

  const value: NotificationContextType = {
    unreadCount,
    setUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    resetUnreadCount,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
