import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

let socketInstance: Socket | null = null

/**
 * useSocket - Singleton Socket.io connection hook
 * Manages a single WebSocket connection that persists across page navigation
 * Authenticates using JWT token from NextAuth session
 *
 * @returns {Socket | null} Socket.io instance or null if not connected
 */
export const useSocket = (): Socket | null => {
  const { data: session } = useSession()
  const socketRef = useRef<Socket | null>(null)

  /**
   * Initialize Socket.io connection on mount
   * Only creates one connection even if hook is used in multiple components
   */
  useEffect(() => {
    // Skip if no session (user not authenticated)
    if (!session?.user) {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
      return
    }

    // If socket already exists and is connected, return it
    if (socketInstance && socketInstance.connected) {
      socketRef.current = socketInstance
      return
    }

    // Create new socket connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'

    const newSocket = io(apiUrl, {
      auth: {
        token: session?.accessToken || session?.user?.token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    })

    /**
     * Connection event handlers
     */
    newSocket.on('connect', () => {
      console.log('[Socket.io] Connected:', newSocket.id)
    })

    newSocket.on('connected', (data) => {
      console.log('[Socket.io] Server confirmed connection:', data)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason)
    })

    newSocket.on('error', (error) => {
      console.error('[Socket.io] Error:', error)
    })

    newSocket.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error)
    })

    // Store in singleton and ref
    socketInstance = newSocket
    socketRef.current = newSocket

    // Cleanup: Disconnect on unmount (only if no other components using it)
    return () => {
      // Note: We don't disconnect here to maintain singleton pattern
      // Socket persists across navigation and only disconnects on logout
    }
  }, [session])

  // Disconnect on logout
  useEffect(() => {
    if (!session && socketInstance) {
      socketInstance.disconnect()
      socketInstance = null
      socketRef.current = null
    }
  }, [session])

  return socketRef.current
}

/**
 * Helper function to get socket instance without React hooks
 * Useful for calling from non-component code
 */
export const getSocketInstance = (): Socket | null => {
  return socketInstance
}

/**
 * Helper function to disconnect socket
 * Called on logout
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
