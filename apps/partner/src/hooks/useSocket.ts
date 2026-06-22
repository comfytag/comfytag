import { useEffect, useState } from 'react'
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
  // useState (not useRef) so callers re-render when the socket becomes available
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    // Disconnect and clear when logged out
    if (!session?.user) {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
      setSocket(null)
      return
    }

    // Reuse existing connected singleton
    if (socketInstance && socketInstance.connected) {
      setSocket(socketInstance)
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'

    const newSocket = io(apiUrl, {
      auth: {
        token: session.user.token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    })

    newSocket.on('error', (error) => {
      console.error('[Socket.io] Error:', error)
    })

    newSocket.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error)
    })

    // Persist as singleton and expose to callers via state
    socketInstance = newSocket
    setSocket(newSocket)

    // Socket persists across navigation — only disconnects on logout
  }, [session])

  return socket
}

export const getSocketInstance = (): Socket | null => socketInstance

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

