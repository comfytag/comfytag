# ComfyTag Real-Time Notifications System (Socket.io Architecture)

**Document Type:** Architecture Design  
**Status:** Ready for Implementation  
**Target Audience:** Backend Engineer, Mobile/Frontend Engineer  
**Last Updated:** June 7, 2026

---

## 1. OVERVIEW & REQUIREMENTS

### Goals
1. **Real-time Notification Delivery** — Users see new notifications instantly via WebSocket
2. **Global Notification Badge** — Unread count updates in navbar without page refresh (visible on all pages)
3. **Dual-App Implementation** — Partner dashboard + Web app receive real-time updates simultaneously
4. **Backwards Compatibility** — Keep REST API intact for mobile app and fallback scenarios
5. **Resilient to Disconnections** — Handle network outages gracefully with reconnection logic

### Current State
- REST API endpoints exist: `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`
- Notification model with fields: `user_id`, `type`, `title`, `message`, `read`, `data`, `createdAt`
- Partner + web apps use React Query for data fetching
- Notification components already exist: `NotificationsPanel`, `NotificationRow`
- No Socket.io infrastructure currently in place

### Non-Goals
- Don't modify the Notification model
- Don't break existing REST endpoints
- Don't implement push notifications (Firebase handles that separately)
- Don't change the design.md (design system is locked)

---

## 2. SERVER-SIDE ARCHITECTURE

### 2.1 Socket.io Server Setup

**File Location:** `/apps/api/socket/index.js` (new)

```javascript
// apps/api/socket/index.js
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

/**
 * Initialize Socket.io server
 * Called during app bootstrap (see app.js integration below)
 * 
 * @param {http.Server} httpServer - The Express HTTP server instance
 * @returns {Server} - Socket.io server instance
 */
export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',       // web dev
        'http://localhost:3001',       // partner dev
        'http://localhost:3002',       // admin dev
        process.env.WEB_URL,
        process.env.PARTNER_URL,
        process.env.ADMIN_URL,
      ].filter(Boolean),
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  // ─── Authentication Middleware ───
  // Verify JWT token from query string or auth header
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token

    if (!token) {
      return next(new Error('Authentication error: No token provided'))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      socket.userEmail = decoded.email
      next()
    } catch (err) {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  // ─── Connection Handler ───
  io.on('connection', (socket) => {
    const userId = socket.userId
    const userEmail = socket.userEmail

    console.log(`[Socket] User ${userId} connected (socket: ${socket.id})`)

    // Join user-specific room
    // All notifications for this user are emitted to this room
    socket.join(`user:${userId}`)

    // ─── Events ───
    // Client can listen to these events

    // Event 1: notification:received
    // Emitted when a new notification is created for the user
    // Payload: { notification: Notification }
    // Used to: Add notification to list, update unread count, show toast

    // Event 2: notification:read
    // Emitted when the user marks a single notification as read
    // Payload: { notificationId: string, read: boolean }
    // Used to: Update notification UI state, decrement unread count

    // Event 3: notification:readAll
    // Emitted when the user marks all notifications as read
    // Payload: { count: number (how many marked as read) }
    // Used to: Reset unread count badge

    // Event 4: unreadCount:update
    // Emitted whenever unread count changes (backup event)
    // Payload: { unreadCount: number }
    // Used to: Sync unread count badge across tabs

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${userId} disconnected (socket: ${socket.id})`)
    })

    // Client-side acknowledgment (optional keepalive)
    socket.on('pong', () => {
      console.log(`[Socket] Pong from user ${userId}`)
    })
  })

  return io
}

/**
 * Helper: Emit notification to a specific user
 * Called by controllers when creating a notification
 * 
 * @param {Server} io - Socket.io server instance
 * @param {string} userId - Target user ID
 * @param {Notification} notification - Notification document
 */
export function emitNotificationToUser(io, userId, notification) {
  io.to(`user:${userId}`).emit('notification:received', {
    notification,
  })
}

/**
 * Helper: Emit unread count update to a specific user
 * Called after markAsRead / markAllAsRead API calls
 * 
 * @param {Server} io - Socket.io server instance
 * @param {string} userId - Target user ID
 * @param {number} unreadCount - Updated unread count
 */
export function emitUnreadCountToUser(io, userId, unreadCount) {
  io.to(`user:${userId}`).emit('unreadCount:update', {
    unreadCount,
  })
}

/**
 * Helper: Emit read status update to a specific user
 * Called after markAsRead API call
 * 
 * @param {Server} io - Socket.io server instance
 * @param {string} userId - Target user ID
 * @param {string} notificationId - Notification ID
 */
export function emitNotificationReadToUser(io, userId, notificationId) {
  io.to(`user:${userId}`).emit('notification:read', {
    notificationId,
    read: true,
  })
}
```

### 2.2 Express App Integration

**File Location:** `/apps/api/app.js` (modifications)

```javascript
// At the top of app.js, after other imports:
import { createServer } from 'http'
import { initializeSocket } from './socket/index.js'

// ─── App Initialization ───

// Create HTTP server (instead of letting Express create one implicitly)
const httpServer = createServer(app)

// Initialize Socket.io
const io = initializeSocket(httpServer)

// Store io instance globally for controllers to access
app.locals.io = io

// ─── Server Startup ───

const PORT = 4002
httpServer.listen(PORT, () => {
  console.log(`[API] Server running on port ${PORT}`)
  console.log(`[Socket.io] WebSocket server initialized`)
})

export default app
```

### 2.3 Notification Controller Updates

**File Location:** `/apps/api/controllers/notification.js` (modifications)

The `createNotification` helper function needs to emit to Socket.io:

```javascript
// apps/api/controllers/notification.js

// UPDATE: Add io parameter to function signature
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  io, // NEW: Socket.io instance from controller or route
}) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      data
    })

    // NEW: Emit to Socket.io if io is available
    if (io) {
      io.to(`user:${userId}`).emit('notification:received', {
        notification,
      })
    }

    return notification
  } catch (err) {
    console.error('Failed to create notification:', err.message)
    // Non-fatal — don't crash the parent operation
  }
}
```

### 2.4 Update REST API Endpoints to Emit Socket Events

**File Location:** `/apps/api/controllers/notification.js` (modifications)

Update the `markAsRead` and `markAllAsRead` functions to emit Socket.io events:

```javascript
// PUT /notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { read: true },
      { new: true }
    )
    if (!notification) {
      return next(createError(404, 'Notification not found'))
    }

    // NEW: Emit socket event
    const io = req.app.locals.io
    if (io) {
      // Emit to the specific user's room
      io.to(`user:${req.user.id}`).emit('notification:read', {
        notificationId: notification._id,
        read: true,
      })

      // Also emit updated unread count
      const unreadCount = await Notification.countDocuments({
        user_id: req.user.id,
        read: false,
      })
      io.to(`user:${req.user.id}`).emit('unreadCount:update', {
        unreadCount,
      })
    }

    res.status(200).json({ message: 'Marked as read', notification })
  } catch (err) {
    next(err)
  }
}

// PUT /notifications/read-all
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { user_id: req.user.id, read: false },
      { read: true }
    )

    // NEW: Emit socket event
    const io = req.app.locals.io
    if (io) {
      io.to(`user:${req.user.id}`).emit('notification:readAll', {
        count: result.modifiedCount,
      })

      // Also emit updated unread count (should be 0)
      io.to(`user:${req.user.id}`).emit('unreadCount:update', {
        unreadCount: 0,
      })
    }

    res.status(200).json({ message: 'All notifications marked as read' })
  } catch (err) {
    next(err)
  }
}
```

### 2.5 Integration in Controllers (Example: audience.js)

Wherever `createNotification` is called, pass the `io` instance:

```javascript
// apps/api/controllers/audience.js (example)

export const someControllerFunction = async (req, res, next) => {
  try {
    // ... business logic ...

    // When creating a notification:
    await createNotification({
      userId: attendee.user_id,
      type: 'ticket_confirmed',
      title: 'Your ticket is confirmed',
      message: `You've successfully purchased a ticket for ${event.name}`,
      data: { eventId: event._id, ticketId: ticket._id },
      io: req.app.locals.io, // NEW: Pass io instance
    })

    res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
}
```

### 2.6 Environment Variables (No Changes Needed)

The following environment variables already exist and will be used:
- `JWT_SECRET` — Used to verify Socket.io auth tokens
- `WEB_URL`, `PARTNER_URL`, `ADMIN_URL` — CORS origins

---

## 3. CLIENT-SIDE ARCHITECTURE (Next.js Apps)

### 3.1 Socket.io Client Hook

**File Location:** `/apps/partner/src/lib/socket.ts` (new)

This hook can be shared across both apps (partner + web) by placing it in a shared location or duplicating it.

```typescript
// apps/partner/src/lib/socket.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { io as ioClient, Socket } from 'socket.io-client'

let globalSocket: Socket | null = null

/**
 * Initialize Socket.io connection (singleton pattern)
 * Prevents multiple socket connections from the same client
 */
function getOrCreateSocket(token: string): Socket {
  if (globalSocket && globalSocket.connected) {
    return globalSocket
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'

  globalSocket = ioClient(apiUrl, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  return globalSocket
}

/**
 * useSocket Hook
 * Manages Socket.io connection lifecycle
 * 
 * Usage:
 *   const socket = useSocket()
 *   if (socket) {
 *     socket.on('notification:received', (data) => { ... })
 *   }
 */
export function useSocket(): Socket | null {
  const { data: session } = useSession()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!session?.user) {
      // Disconnect if no session
      if (socketRef.current?.connected) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const token = (session as any).user?.token || (session as any).accessToken

    if (!token) {
      console.warn('[Socket] No token available for Socket.io connection')
      return
    }

    // Get or create socket
    socketRef.current = getOrCreateSocket(token)

    // If already connected, just return
    if (socketRef.current.connected) {
      return
    }

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('[Socket] Connected:', socketRef.current?.id)
    })

    socketRef.current.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })

    socketRef.current.on('connect_error', (error: any) => {
      console.error('[Socket] Connection error:', error.message)
    })

    // Cleanup function
    return () => {
      // Don't disconnect on unmount (keep connection alive across page navigations)
      // Only disconnect when user logs out (handled above)
    }
  }, [session])

  return socketRef.current
}

/**
 * Disconnect socket (call on logout)
 */
export function disconnectSocket() {
  if (globalSocket?.connected) {
    globalSocket.disconnect()
  }
  globalSocket = null
}
```

### 3.2 Notification Socket Hook

**File Location:** `/apps/partner/src/lib/useNotificationSocket.ts` (new)

```typescript
// apps/partner/src/lib/useNotificationSocket.ts
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from './socket'
import type { Notification } from '@comfytag/types'

export interface UseNotificationSocketOptions {
  onNotificationReceived?: (notification: Notification) => void
  onUnreadCountChanged?: (count: number) => void
  autoInvalidateQueries?: boolean // default: true
}

/**
 * useNotificationSocket Hook
 * Listens for real-time notification events and syncs with React Query
 * 
 * Usage:
 *   const { unreadCount, setUnreadCount } = useNotificationSocket()
 *   
 *   // Or with callbacks:
 *   useNotificationSocket({
 *     onNotificationReceived: (notif) => showToast(notif.title),
 *     onUnreadCountChanged: (count) => updateBadge(count),
 *   })
 */
export function useNotificationSocket(options: UseNotificationSocketOptions = {}) {
  const socket = useSocket()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const {
    onNotificationReceived,
    onUnreadCountChanged,
    autoInvalidateQueries = true,
  } = options

  useEffect(() => {
    if (!socket || !session?.user) return

    // ─── notification:received ───
    // Fired when a new notification is created for this user
    const handleNotificationReceived = (data: { notification: Notification }) => {
      console.log('[Socket] Notification received:', data.notification)

      // Optional callback
      if (onNotificationReceived) {
        onNotificationReceived(data.notification)
      }

      // Auto-invalidate React Query cache
      if (autoInvalidateQueries) {
        queryClient.invalidateQueries({
          queryKey: ['notifications', session.user.id],
        })
      }
    }

    socket.on('notification:received', handleNotificationReceived)

    // ─── notification:read ───
    // Fired when a single notification is marked as read
    const handleNotificationRead = (data: {
      notificationId: string
      read: boolean
    }) => {
      console.log('[Socket] Notification marked read:', data.notificationId)

      if (autoInvalidateQueries) {
        // Update React Query cache directly
        queryClient.setQueryData(
          ['notifications', session.user.id],
          (old: any) => {
            if (!old) return old
            return {
              ...old,
              notifications: old.notifications.map((n: Notification) =>
                n._id === data.notificationId ? { ...n, read: true } : n
              ),
              unreadCount: Math.max(0, old.unreadCount - 1),
            }
          }
        )
      }
    }

    socket.on('notification:read', handleNotificationRead)

    // ─── notification:readAll ───
    // Fired when all notifications are marked as read
    const handleNotificationReadAll = (data: { count: number }) => {
      console.log('[Socket] All notifications marked read, count:', data.count)

      if (autoInvalidateQueries) {
        queryClient.setQueryData(
          ['notifications', session.user.id],
          (old: any) => {
            if (!old) return old
            return {
              ...old,
              notifications: old.notifications.map((n: Notification) => ({
                ...n,
                read: true,
              })),
              unreadCount: 0,
            }
          }
        )
      }
    }

    socket.on('notification:readAll', handleNotificationReadAll)

    // ─── unreadCount:update ───
    // Fired whenever unread count changes
    const handleUnreadCountUpdate = (data: { unreadCount: number }) => {
      console.log('[Socket] Unread count updated:', data.unreadCount)

      if (onUnreadCountChanged) {
        onUnreadCountChanged(data.unreadCount)
      }

      if (autoInvalidateQueries) {
        queryClient.setQueryData(
          ['notifications', session.user.id],
          (old: any) => {
            if (!old) return old
            return {
              ...old,
              unreadCount: data.unreadCount,
            }
          }
        )
      }
    }

    socket.on('unreadCount:update', handleUnreadCountUpdate)

    // Cleanup: remove listeners on unmount
    return () => {
      socket.off('notification:received', handleNotificationReceived)
      socket.off('notification:read', handleNotificationRead)
      socket.off('notification:readAll', handleNotificationReadAll)
      socket.off('unreadCount:update', handleUnreadCountUpdate)
    }
  }, [socket, session, queryClient, onNotificationReceived, onUnreadCountChanged, autoInvalidateQueries])
}
```

### 3.3 Notification Badge Context (Global State)

**File Location:** `/apps/partner/src/context/NotificationContext.tsx` (new)

For managing unread count across the entire app without prop drilling:

```typescript
// apps/partner/src/context/NotificationContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface NotificationContextType {
  unreadCount: number
  setUnreadCount: (count: number) => void
  incrementUnreadCount: (amount?: number) => void
  decrementUnreadCount: (amount?: number) => void
  resetUnreadCount: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)

  const incrementUnreadCount = useCallback((amount = 1) => {
    setUnreadCount((prev) => prev + amount)
  }, [])

  const decrementUnreadCount = useCallback((amount = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - amount))
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

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
```

### 3.4 Root Layout Updates

**File Location:** `/apps/partner/src/app/layout.tsx` (modifications)

```typescript
// apps/partner/src/app/layout.tsx

import { NotificationProvider } from '@/context/NotificationContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          {/* existing providers */}
          {children}
        </NotificationProvider>
      </body>
    </html>
  )
}
```

### 3.5 Navbar Badge Component

**File Location:** `/apps/partner/src/components/layout/NotificationBadge.tsx` (new)

```typescript
// apps/partner/src/components/layout/NotificationBadge.tsx
'use client'

import { useNotifications } from '@/context/NotificationContext'
import { useNotificationSocket } from '@/lib/useNotificationSocket'

export function NotificationBadge() {
  const { unreadCount, setUnreadCount } = useNotifications()

  // Listen for real-time unread count updates
  useNotificationSocket({
    onUnreadCountChanged: setUnreadCount,
  })

  if (unreadCount === 0) return null

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-error)',
        color: 'white',
        fontSize: '11px',
        fontWeight: 700,
        zIndex: 10,
      }}
      title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}
```

### 3.6 Updated Navbar Layout

**File Location:** `/apps/partner/src/components/layout/Navbar.tsx` (modifications)

```typescript
// apps/partner/src/components/layout/Navbar.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Bell } from 'lucide-react'
import { NotificationBadge } from './NotificationBadge'
import { NotificationPanel } from '@/components/notifications/NotificationsPanel'

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-5)',
        height: '64px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Logo / Branding */}
      <Link href="/overview" style={{ fontSize: '20px', fontWeight: 700 }}>
        ComfyTag
      </Link>

      {/* Right Section: Notifications + Profile */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Notification Bell Icon */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
            }}
            title="Notifications"
          >
            <Bell size={20} />
            <NotificationBadge />
          </button>

          {/* Notification Panel Dropdown */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '400px',
                maxHeight: '500px',
                backgroundColor: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <NotificationPanel />
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div>
          <button
            onClick={() => signOut()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
          >
            {session?.user?.name || 'Profile'}
          </button>
        </div>
      </div>
    </nav>
  )
}
```

### 3.7 Updated NotificationsPanel Component

**File Location:** `/apps/partner/src/components/notifications/NotificationsPanel.tsx` (modifications)

Add Socket.io integration to sync in real-time:

```typescript
// apps/partner/src/components/notifications/NotificationsPanel.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, EmptyState, LoadingSpinner } from '@comfytag/ui'
import type { Notification } from '@comfytag/types'
import { NotificationRow } from './NotificationRow'
import { api } from '@/lib/api'
import { useNotifications } from '@/context/NotificationContext'
import { useNotificationSocket } from '@/lib/useNotificationSocket'

export function NotificationsPanel() {
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { setUnreadCount } = useNotifications()

  // Fetch notifications from API
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', session?.user.id],
    queryFn: () =>
      api.get('/notifications?limit=50').then((r) => r.data),
    enabled: !!session?.user.id,
  })

  // Listen for real-time updates
  useNotificationSocket({
    onUnreadCountChanged: setUnreadCount,
  })

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      api.put('/notifications/read-all', {}).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', session?.user.id]
      })
    },
  })

  const markOneReadMutation = useMutation({
    mutationFn: (notifId: string) =>
      api.put(`/notifications/${notifId}/read`, {}).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', session?.user.id]
      })
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  if (notifications.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <EmptyState
          title="No notifications yet"
          subtitle="You will be notified about ticket sales, payouts, and important updates here"
        />
      </div>
    )
  }

  return (
    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
      {unreadCount > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <Button
            variant="ghost"
            size="sm"
            loading={markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            Mark all as read
          </Button>
        </div>
      )}

      <div>
        {notifications.map((notif) => (
          <NotificationRow
            key={notif._id}
            notification={notif}
            onMarkRead={(id) => markOneReadMutation.mutate(id)}
            onNavigate={(path) => router.push(path)}
            isMarkingRead={markOneReadMutation.isPending}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 4. SETUP CHECKLIST

### 4.1 Dependencies to Install

**Backend:**
```bash
cd apps/api
npm install socket.io
npm install --save-dev @types/node # if not already installed
```

**Partner App:**
```bash
cd apps/partner
npm install socket.io-client
```

**Web App:**
```bash
cd apps/web
npm install socket.io-client
```

### 4.2 Files to Create

**Backend:**
- `/apps/api/socket/index.js` — Socket.io server initialization

**Partner App:**
- `/apps/partner/src/lib/socket.ts` — Socket.io client hook
- `/apps/partner/src/lib/useNotificationSocket.ts` — Notification socket hook
- `/apps/partner/src/context/NotificationContext.tsx` — Global notification state
- `/apps/partner/src/components/layout/NotificationBadge.tsx` — Badge component

**Web App (duplicate Partner setup):**
- `/apps/web/src/lib/socket.ts`
- `/apps/web/src/lib/useNotificationSocket.ts`
- `/apps/web/src/context/NotificationContext.tsx`
- `/apps/web/src/components/layout/NotificationBadge.tsx`

### 4.3 Files to Modify

**Backend:**
- `/apps/api/app.js` — Integrate Socket.io server
- `/apps/api/controllers/notification.js` — Add Socket.io emissions
- All controllers that call `createNotification` — Pass `io` instance

**Partner & Web Apps:**
- `/apps/[app]/src/app/layout.tsx` — Add NotificationProvider
- `/apps/[app]/src/components/layout/Navbar.tsx` — Add NotificationBadge
- `/apps/[app]/src/components/notifications/NotificationsPanel.tsx` — Integrate useNotificationSocket

---

## 5. EVENT FLOW DIAGRAMS

### 5.1 New Notification Flow

```
User A purchases a ticket
    ↓
API Controller (audience.js) creates Notification
    ↓
createNotification({..., io}) called
    ↓
Notification saved to MongoDB
    ↓
Socket.io emits: io.to(`user:${userId}`).emit('notification:received', {...})
    ↓
User A's connected socket(s) receive event
    ↓
Client: onNotificationReceived callback fires
    ↓
React Query cache invalidated / updated
    ↓
NotificationsPanel re-renders with new notification
    ↓
Unread count incremented in NotificationBadge
```

### 5.2 Mark as Read Flow

```
User clicks "Mark read" button in NotificationsPanel
    ↓
markOneReadMutation.mutate(notifId)
    ↓
REST API: PUT /notifications/:id/read
    ↓
Backend marks notification as read in MongoDB
    ↓
Socket.io emits: notification:read event
    ↓
Client receives notification:read
    ↓
useNotificationSocket listener updates React Query cache
    ↓
Unread count decremented in NotificationBadge
```

### 5.3 Network Reconnection Flow

```
User loses internet connection (browser freezes)
    ↓
Socket.io client detects disconnection
    ↓
Socket.io auto-attempts reconnection (exponential backoff)
    ↓
After 1-5 seconds, connection re-established
    ↓
Client emits 'connect' event
    ↓
useSocket hook logs reconnection
    ↓
Client-side state is preserved (React Query cache intact)
    ↓
Any missed events are fetched via REST API (next React Query invalidation)
```

---

## 6. ARCHITECTURE DECISIONS & RATIONALE

### 6.1 Why Socket.io Over Native WebSocket?

- **Fallback to polling** if WebSocket unavailable (mobile networks, firewalls)
- **Automatic reconnection** with exponential backoff
- **Rooms/namespaces** for user isolation (better than manual filtering)
- **Event-based** API (easier than raw WebSocket message handling)

### 6.2 Why Keep REST Endpoints?

- **Mobile app** still uses REST API (no Socket.io on React Native yet)
- **Backwards compatibility** with existing integrations
- **Stateless design** — no Socket.io state required for basic operations
- **Recovery** — if Socket.io is down, REST API still works

### 6.3 Why Context API for Global State?

- **Lightweight** for a single value (unread count)
- **No extra libraries** (Zustand, Redux not needed)
- **Easy to test** in isolation
- **Prevents prop drilling** across navbar + multiple pages

### 6.4 Why User-Specific Rooms?

- **Security** — Each user only receives their own notifications
- **Scalability** — No global broadcast overhead
- **Isolation** — If one user has issues, others unaffected

### 6.5 Why Singleton Socket Instance?

- **Single connection** per browser tab (efficient)
- **Persistent** across page navigations (no reconnection overhead)
- **Auto-disconnect** on logout only (not on unmount)

### 6.6 Session Token Authentication

- **JWT from session** — Avoids storing extra tokens
- **Verified on Socket.io middleware** — Same JWT_SECRET as REST API
- **Consistent with existing auth** — No new auth logic needed

---

## 7. INTEGRATION POINTS & EXAMPLE CONTROLLERS

### 7.1 Where to Emit Notifications

**Pattern:** Any controller that creates a notification should emit to Socket.io.

**Controllers to Update:**

| Controller | Notification Type | Trigger |
|------------|-------------------|---------|
| `audience.js` | `ticket_confirmed` | After successful ticket purchase |
| `transfer.js` | `transfer_received`, `transfer_accepted`, `transfer_declined` | Transfer status changes |
| `auth.js` | Various | Account-related events |
| `promos.js` | — | Promo notifications (if applicable) |
| Backend jobs (email queue, win-back) | `event_reminder` | Scheduled task emits |

**Example: audience.js**

```javascript
// apps/api/controllers/audience.js

export const buyTicket = async (req, res, next) => {
  try {
    // ... existing business logic ...

    // Create attendance record
    const attendance = await Audience.create({
      event_id: eventId,
      user_id: userId,
      // ... other fields
    })

    // Create notification
    await createNotification({
      userId,
      type: 'ticket_confirmed',
      title: `Ticket confirmed for ${event.name}`,
      message: `Your ticket is ready. Show your face at the entrance.`,
      data: {
        eventId: event._id,
        ticketId: attendance._id,
      },
      io: req.app.locals.io, // ← Pass io instance
    })

    res.status(200).json({ success: true, attendance })
  } catch (err) {
    next(err)
  }
}
```

---

## 8. TESTING STRATEGY

### 8.1 Manual Testing (Two Browser Windows)

**Setup:**
1. Start API: `cd apps/api && npm run dev` (port 4002)
2. Start Partner: `cd apps/partner && npm run dev` (port 3001)
3. Open two browser windows (Window A + Window B)
4. Log in as same user in both windows

**Test 1: Receive Notification**
1. In Window A, trigger a notification (e.g., buy a ticket via API curl)
2. Observe Window B immediately shows new notification (no page refresh)
3. Observe badge count increases in both windows

**Test 2: Mark as Read**
1. In Window A, click "Mark read" on a notification
2. Observe Window B shows notification as read (strikethrough, disabled state)
3. Observe badge count decreases in both windows

**Test 3: Network Disconnect**
1. In DevTools, throttle network or disable internet
2. Wait 5+ seconds
3. Re-enable network
4. Verify Socket.io automatically reconnects
5. Create a new notification
6. Verify it appears in reconnected window

### 8.2 E2E Test Scenarios (Playwright)

**File Location:** `/tests/e2e/05-notifications-realtime.spec.ts` (new)

```typescript
// tests/e2e/05-notifications-realtime.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Real-time Notifications (Socket.io)', () => {
  test('should receive new notification in real-time', async ({ page }) => {
    // Log in to partner dashboard
    await page.goto('http://localhost:3001/login')
    // ... login steps ...

    // Open DevTools to observe socket connection
    // (in real test, use page.evaluateHandle to verify socket exists)

    // Trigger a notification via API
    const response = await page.request.post(
      'http://localhost:4002/api/notifications/test',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Test Notification',
          message: 'This is a real-time test',
        },
      }
    )

    // Verify notification appears without page refresh
    await expect(page.locator('text=Test Notification')).toBeVisible({
      timeout: 2000, // Should appear within 2 seconds
    })

    // Verify badge count
    const badge = page.locator('[title*="unread"]')
    await expect(badge).toContainText(/\d+/)
  })

  test('should sync unread count across tabs', async ({ context }) => {
    // Open two browser windows
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    // Log in on both
    // ... login steps on both pages ...

    // Trigger notification on page1
    // Observe badge updated on page2 in real-time

    // Mark as read on page1
    // Observe badge decrements on page2
  })
})
```

### 8.3 Socket.io Debug Mode

**Enable socket logging in browser console:**

```javascript
// In browser DevTools console
localStorage.debug = 'socket.io*'
location.reload()
```

**Backend logs:**
Check console for `[Socket] User ... connected/disconnected` messages.

---

## 9. DEPLOYMENT CONSIDERATIONS

### 9.1 Environment Variables

Add to `.env` (backend):
```
JWT_SECRET=your_jwt_secret
# (existing vars already cover API URL, CORS, etc.)
```

Add to `.env.local` (Next.js apps):
```
NEXT_PUBLIC_API_URL=https://api.comfytag.ng
# (or local dev URL)
```

### 9.2 Scaling to Multiple Servers

If deploying to multiple backend instances (e.g., load-balanced), use Redis adapter:

```javascript
// apps/api/socket/index.js (future enhancement)
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

const pubClient = createClient()
const subClient = pubClient.duplicate()

await Promise.all([pubClient.connect(), subClient.connect()])

io.adapter(createAdapter(pubClient, subClient))
```

This allows Socket.io connections on any server instance to reach the same user.

### 9.3 Production Checklist

- [ ] Socket.io transports set to `['websocket']` only (remove polling if not needed)
- [ ] CORS origins validated (no wildcards in production)
- [ ] Token validation on every Socket.io handshake
- [ ] Error handling for failed Socket.io emissions (non-blocking)
- [ ] Monitoring of socket connection count and errors
- [ ] Load testing with expected concurrent connections
- [ ] Test failover/reconnection under load

---

## 10. IMPLEMENTATION PHASES

### Phase 1: Backend Setup (2–3 hours)
1. Create `/apps/api/socket/index.js`
2. Integrate Socket.io into `app.js`
3. Update `controllers/notification.js` to emit events
4. Test connection via `localhost:4002/socket.io/`

### Phase 2: Partner App (4–5 hours)
1. Create socket hooks + context
2. Update layout with NotificationBadge
3. Integrate useNotificationSocket into NotificationsPanel
4. Test real-time sync in two browser windows

### Phase 3: Web App (2–3 hours)
1. Duplicate Partner setup (reuse same hook code)
2. Integrate into web app navbar + notifications
3. Cross-app testing (Partner + Web simultaneously)

### Phase 4: Testing & Hardening (3–4 hours)
1. Manual testing (all scenarios from Section 8.1)
2. Playwright E2E tests
3. Network error handling
4. Load testing

### Phase 5: Documentation & Deployment (2 hours)
1. Update deployment guides
2. Configure production environment variables
3. Deploy to staging, test, deploy to production

**Total Estimated Time:** 13–17 hours (2–3 days with testing)

---

## 11. FALLBACK STRATEGY

### What If Socket.io Fails?

**Scenario:** Socket.io server is down, but REST API is up.

**Mitigation:**
- REST API endpoints still work
- React Query will fetch notifications on next page load / refetch
- NoticationBadge will show stale data until refresh
- User can still interact with notifications (mark as read via REST)

**Recommended Recovery:**
1. Add error boundary in useSocket hook
2. Log Socket.io errors to monitoring service
3. Alert ops team if socket error rate > 5%
4. Manual fallback: Show toast "Real-time notifications unavailable, please refresh"

---

## 12. MONITORING & OBSERVABILITY

### Key Metrics to Track

1. **Socket.io Connection Count** — Should match logged-in users
2. **Connection Errors** — Authentication failures, disconnections
3. **Event Emission Latency** — Time from notification creation to client reception
4. **Reconnection Rate** — How often users reconnect
5. **Message Loss** — Notifications that never arrived (correlate with crashes)

### Logging Format

```javascript
console.log(`[Socket] User ${userId} connected (socket: ${socket.id})`)
console.error(`[Socket] Emit failed for user ${userId}:`, err.message)
```

---

## 13. FUTURE ENHANCEMENTS

1. **Notification Sound/Vibration** — Play sound on receipt (optional)
2. **Read Receipts** — Track when user opens notification panel
3. **Typing Indicators** — Show "New notification..." before full object arrives
4. **Offline Queue** — Queue notifications during disconnection, deliver on reconnect
5. **Redis Adapter** — Multi-server Socket.io sync
6. **Mobile Integration** — Adapt Socket.io client for React Native (currently REST-only)
7. **Notification Preferences** — User can toggle real-time for certain types

---

## SUMMARY

This Socket.io architecture provides:

✅ **Real-time delivery** of notifications to all connected clients  
✅ **Global notification badge** that updates without page refresh  
✅ **Dual-app support** (Partner + Web) with shared socket infrastructure  
✅ **Backwards compatibility** via retained REST endpoints  
✅ **Resilience** with automatic reconnection and fallback to REST  
✅ **Security** via JWT token validation  
✅ **Scalability** with user-specific rooms and optional Redis adapter  

**Ready to implement!**
