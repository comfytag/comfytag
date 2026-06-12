'use client'

import React, { createContext, useState, useCallback, ReactNode } from 'react'

interface NotificationContextType {
  unreadCount: number
  setUnreadCount: (count: number) => void
  incrementUnreadCount: () => void
  decrementUnreadCount: () => void
  resetUnreadCount: () => void
}

export const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  incrementUnreadCount: () => {},
  decrementUnreadCount: () => {},
  resetUnreadCount: () => {},
})

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0)

  const incrementUnreadCount = useCallback(() => setUnreadCount((p) => p + 1), [])
  const decrementUnreadCount = useCallback(() => setUnreadCount((p) => Math.max(0, p - 1)), [])
  const resetUnreadCount = useCallback(() => setUnreadCount(0), [])

  return (
    <NotificationContext.Provider
      value={{ unreadCount, setUnreadCount, incrementUnreadCount, decrementUnreadCount, resetUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
