import { useEffect, useContext } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from './useSocket'
import { NotificationContext } from '@/contexts/NotificationContext'
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
  const { setUnreadCount } = useContext(NotificationContext)

  useEffect(() => {
    if (!socket) return

    /**
     * Listen for new notification received
     * Add to React Query cache and update unread count
     */
    const handleNotificationReceived = (notification: Notification) => {
      // Update React Query cache
      queryClient.setQueryData(
        ['notifications'],
        (oldData: any) => {
          if (!oldData) return { notifications: [notification] }
          return {
            ...oldData,
            notifications: [notification, ...oldData.notifications],
            unreadCount: (oldData.unreadCount || 0) + 1,
          }
        }
      )

      // Invalidate notifications query to trigger fresh fetch if needed
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }

    /**
     * Listen for unread count updates
     * Update context and React Query cache
     */
    const handleUnreadCountUpdate = (data: { unreadCount: number; updatedAt: string }) => {
      // Update global context
      setUnreadCount(data.unreadCount)

      // Update React Query cache
      queryClient.setQueryData(
        ['notifications'],
        (oldData: any) => {
          if (!oldData) return { unreadCount: data.unreadCount }
          return {
            ...oldData,
            unreadCount: data.unreadCount,
          }
        }
      )
    }

    /**
     * Listen for single notification marked as read
     * Update cache and unread count
     */
    const handleNotificationRead = (data: { notificationId: string; read: boolean; readAt: string }) => {
      // Update React Query cache
      queryClient.setQueryData(
        ['notifications'],
        (oldData: any) => {
          if (!oldData) return oldData

          const updatedNotifications = oldData.notifications?.map((notif: Notification) =>
            notif._id === data.notificationId ? { ...notif, read: true } : notif
          )

          return {
            ...oldData,
            notifications: updatedNotifications,
          }
        }
      )
    }

    /**
     * Listen for all notifications marked as read
     * Reset unread count and update cache
     */
    const handleAllNotificationsRead = () => {
      // Update global context
      setUnreadCount(0)

      // Update React Query cache
      queryClient.setQueryData(
        ['notifications'],
        (oldData: any) => {
          if (!oldData) return { unreadCount: 0 }

          const updatedNotifications = oldData.notifications?.map((notif: Notification) => ({
            ...notif,
            read: true,
          }))

          return {
            ...oldData,
            notifications: updatedNotifications,
            unreadCount: 0,
          }
        }
      )
    }

    /**
     * Listen for initial unread count on connection
     * (Optional: if server sends initial state)
     */
    const handleConnected = (data: any) => {
      // Optionally fetch initial unread count here
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
  }, [socket, queryClient, setUnreadCount])
}
