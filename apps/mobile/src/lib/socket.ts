// Requires: pnpm add socket.io-client  (run in apps/mobile/)
import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connectSocket(userId: string): Socket {
  if (socket?.connected) return socket

  socket = io(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4002', {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    socket?.emit('join_room', userId)
  })

  socket.on('disconnect', () => {
    // Reconnection handled by socket.io-client automatically
  })

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket(): Socket | null {
  return socket
}

// ─── Event name constants ──────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  CHECKIN_UPDATE: 'checkin:update',
  TICKET_STATUS: 'ticket:status',
} as const
