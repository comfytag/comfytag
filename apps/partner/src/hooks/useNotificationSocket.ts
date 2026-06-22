import { useEffect, useContext } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useSocket } from './useSocket'
import { NotificationContext } from '@/contexts/NotificationContext'
import { api } from '@/lib/api'
import { Notification } from '@comfytag/types'

/**
 * useNotificationSocket - Real-time notification listener
 * Listens to Socket.io events and syncs with React Query cache
 * Updates global notification count in context
 *
 * Call this hook once at the root level (e.g., in Layout or App component)
 */
export const useNotificationSocket = () => {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const { setUnreadCount, incrementUnreadCount } = useContext(NotificationContext)
  const userId = session?.user?.id

  useEffect(() => {
    if (!socket || !userId) return

    // All cache operations must use the same scoped key as notifications/page.tsx
    const notifKey = ['notifications', userId]

    /**
     * Listen for new notification received
     * Add to React Query cache and update unread count
     */
    const handleNotificationReceived = (notification: Notification) => {
      queryClient.setQueryData(notifKey, (oldData: any) => {
        if (!oldData) return { notifications: [notification], unreadCount: 1 }
        return {
          ...oldData,
          notifications: [notification, ...oldData.notifications],
          unreadCount: (oldData.unreadCount || 0) + 1,
        }
      })
      // Sync the nav badge immediately — don't wait for unreadCount:update
      incrementUnreadCount()
    }

    /**
     * Listen for unread count updates
     * Update context and React Query cache
     */
    const handleUnreadCountUpdate = (data: { unreadCount: number; updatedAt: string }) => {
      setUnreadCount(data.unreadCount)
      queryClient.setQueryData(notifKey, (oldData: any) => {
        if (!oldData) return { unreadCount: data.unreadCount }
        return { ...oldData, unreadCount: data.unreadCount }
      })
    }

    /**
     * Listen for single notification marked as read
     * Update cache and unread count
     */
    const handleNotificationRead = (data: { notificationId: string; read: boolean; readAt: string }) => {
      queryClient.setQueryData(notifKey, (oldData: any) => {
        if (!oldData) return oldData
        const updatedNotifications = oldData.notifications?.map((notif: Notification) =>
          notif._id === data.notificationId ? { ...notif, read: true } : notif
        )
        return { ...oldData, notifications: updatedNotifications }
      })
    }

    /**
     * Listen for all notifications marked as read
     * Reset unread count and update cache
     */
    const handleAllNotificationsRead = () => {
      setUnreadCount(0)
      queryClient.setQueryData(notifKey, (oldData: any) => {
        if (!oldData) return { unreadCount: 0 }
        const updatedNotifications = oldData.notifications?.map((notif: Notification) => ({
          ...notif,
          read: true,
        }))
        return { ...oldData, notifications: updatedNotifications, unreadCount: 0 }
      })
    }

    // Seed the badge from HTTP on every socket connect / reconnect.
    // Without this the badge resets to 0 after every page reload.
    const token = session?.user?.token
    const handleConnected = async (_data: any) => {
      if (!token) return
      try {
        const data = await queryClient.fetchQuery({
          queryKey: notifKey,
          queryFn: () =>
            api.get('/notification', {
              params: { page: 1, limit: 50 },
              headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.data),
          staleTime: 30_000,
        })
        if (typeof (data as any)?.unreadCount === 'number') {
          setUnreadCount((data as any).unreadCount)
        }
      } catch {
        // Non-fatal — badge will update on next real-time event
      }
    }

    /**
     * Register event listeners
     */
    socket.on('notification:received', handleNotificationReceived)
    socket.on('unreadCount:update', handleUnreadCountUpdate)
    socket.on('notification:read', handleNotificationRead)
    socket.on('notification:readAll', handleAllNotificationsRead)
    socket.on('allNotifications:read', handleAllNotificationsRead)
    socket.on('connected', handleConnected)

    /**
     * Cleanup: Remove event listeners on unmount
     */
    return () => {
      socket.off('notification:received', handleNotificationReceived)
      socket.off('unreadCount:update', handleUnreadCountUpdate)
      socket.off('notification:read', handleNotificationRead)
      socket.off('notification:readAll', handleAllNotificationsRead)
      socket.off('allNotifications:read', handleAllNotificationsRead)
      socket.off('connected', handleConnected)
    }
  }, [socket, userId, queryClient, setUnreadCount, incrementUnreadCount])
}
