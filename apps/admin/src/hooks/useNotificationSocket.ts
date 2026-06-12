import { useEffect, useContext } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from './useSocket'
import { NotificationContext } from '@/contexts/NotificationContext'

/**
 * Initialise real-time notification listeners for admin users.
 * Call once at shell root (ShellClient or the dashboard layout).
 */
export const useNotificationSocket = () => {
  const socket = useSocket()
  const { data: session } = useSession()
  const { setUnreadCount, incrementUnreadCount } = useContext(NotificationContext)
  const userId = (session?.user as any)?.id

  useEffect(() => {
    if (!socket || !userId) return

    const handleNotificationReceived = () => {
      incrementUnreadCount()
    }

    const handleUnreadCountUpdate = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount)
    }

    const handleAllNotificationsRead = () => {
      setUnreadCount(0)
    }

    socket.on('notification:received', handleNotificationReceived)
    socket.on('unreadCount:update', handleUnreadCountUpdate)
    socket.on('notification:readAll', handleAllNotificationsRead)
    socket.on('allNotifications:read', handleAllNotificationsRead)

    return () => {
      socket.off('notification:received', handleNotificationReceived)
      socket.off('unreadCount:update', handleUnreadCountUpdate)
      socket.off('notification:readAll', handleAllNotificationsRead)
      socket.off('allNotifications:read', handleAllNotificationsRead)
    }
  }, [socket, userId, setUnreadCount, incrementUnreadCount])
}
