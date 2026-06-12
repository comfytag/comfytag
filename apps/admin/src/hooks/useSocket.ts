import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

let socketInstance: Socket | null = null

export const useSocket = (): Socket | null => {
  const { data: session } = useSession()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!session?.user) {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
      return
    }

    if (socketInstance && socketInstance.connected) {
      socketRef.current = socketInstance
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'

    const newSocket = io(apiUrl, {
      auth: { token: (session.user as any).token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    })

    newSocket.on('error', (error: unknown) => {
      console.error('[Admin Socket.io] Error:', error)
    })

    newSocket.on('connect_error', (error: unknown) => {
      console.error('[Admin Socket.io] Connection error:', error)
    })

    socketInstance = newSocket
    socketRef.current = newSocket

    return () => {
      // Singleton — do not disconnect on component unmount
    }
  }, [session])

  useEffect(() => {
    if (!session && socketInstance) {
      socketInstance.disconnect()
      socketInstance = null
      socketRef.current = null
    }
  }, [session])

  return socketRef.current
}

export const disconnectAdminSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
