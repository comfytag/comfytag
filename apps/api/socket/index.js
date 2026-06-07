import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

/**
 * Initialize Socket.io server for real-time notifications
 * @param {http.Server} httpServer - HTTP server instance from Express
 * @returns {Socket.io.Server} Socket.io instance
 */
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
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

  /**
   * Socket.io authentication middleware
   * Verifies JWT token from client handshake
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token

      if (!token) {
        console.warn('[Socket.io] No token provided in handshake')
        return next(new Error('Authentication error: No token provided'))
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT)

      // Attach user ID to socket for later use
      socket.userId = decoded.id || decoded._id
      socket.userEmail = decoded.email

      if (!socket.userId) {
        return next(new Error('Authentication error: Invalid token structure'))
      }

      next()
    } catch (err) {
      console.error('[Socket.io] Authentication error:', err.message)
      next(new Error(`Authentication error: ${err.message}`))
    }
  })

  /**
   * Connection handler
   * Subscribes user to their personal room for notifications
   */
  io.on('connection', (socket) => {
    const userId = socket.userId
    const userEmail = socket.userEmail

    console.log(`[Socket.io] User connected: ${userEmail} (${userId}) - Socket ID: ${socket.id}`)

    // Subscribe user to their personal notification room
    // Format: user:<userId> for easy targeting
    socket.join(`user:${userId}`)
    socket.emit('connected', {
      message: 'Connected to notification server',
      userId,
      socketId: socket.id,
    })

    /**
     * Handle "notification:read" event from client
     * When user marks a single notification as read
     */
    socket.on('notification:read', (data) => {
      console.log(`[Socket.io] User ${userId} marked notification as read:`, data.notificationId)
      // Broadcast to user's room (in case they have multiple tabs open)
      io.to(`user:${userId}`).emit('notification:updated', {
        notificationId: data.notificationId,
        read: true,
      })
    })

    /**
     * Handle "notification:readAll" event from client
     * When user marks all notifications as read
     */
    socket.on('notification:readAll', () => {
      console.log(`[Socket.io] User ${userId} marked all notifications as read`)
      io.to(`user:${userId}`).emit('allNotifications:read')
    })

    /**
     * Handle disconnect event
     */
    socket.on('disconnect', () => {
      console.log(`[Socket.io] User disconnected: ${userEmail} (${userId}) - Socket ID: ${socket.id}`)
    })

    /**
     * Handle connection errors
     */
    socket.on('error', (error) => {
      console.error(`[Socket.io] Socket error for user ${userId}:`, error)
    })
  })

  console.log('[Socket.io] Server initialized and ready for connections')
  return io
}

/**
 * Emit a new notification to a specific user
 * @param {Socket.io.Server} io - Socket.io server instance
 * @param {string} userId - User ID to send notification to
 * @param {Object} notification - Notification object {type, title, message, data, _id}
 */
export const emitNotification = (io, userId, notification) => {
  if (!io || !userId || !notification) {
    console.warn('[Socket.io] Missing parameters for emitNotification', {
      hasIo: !!io,
      userId,
      hasNotification: !!notification,
    })
    return
  }

  console.log(`[Socket.io] Emitting notification to user ${userId}:`, {
    type: notification.type,
    title: notification.title,
  })

  io.to(`user:${userId}`).emit('notification:received', {
    ...notification,
    receivedAt: new Date().toISOString(),
  })
}

/**
 * Update unread count for a specific user
 * @param {Socket.io.Server} io - Socket.io server instance
 * @param {string} userId - User ID
 * @param {number} unreadCount - New unread count
 */
export const emitUnreadCountUpdate = (io, userId, unreadCount) => {
  if (!io || !userId) {
    console.warn('[Socket.io] Missing parameters for emitUnreadCountUpdate')
    return
  }

  console.log(`[Socket.io] Updating unread count for user ${userId}:`, unreadCount)

  io.to(`user:${userId}`).emit('unreadCount:update', {
    unreadCount,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Mark a notification as read for a specific user
 * @param {Socket.io.Server} io - Socket.io server instance
 * @param {string} userId - User ID
 * @param {string} notificationId - Notification ID
 */
export const emitNotificationRead = (io, userId, notificationId) => {
  if (!io || !userId || !notificationId) {
    console.warn('[Socket.io] Missing parameters for emitNotificationRead')
    return
  }

  console.log(`[Socket.io] Marking notification as read for user ${userId}:`, notificationId)

  io.to(`user:${userId}`).emit('notification:read', {
    notificationId,
    read: true,
    readAt: new Date().toISOString(),
  })
}

/**
 * Mark all notifications as read for a specific user
 * @param {Socket.io.Server} io - Socket.io server instance
 * @param {string} userId - User ID
 */
export const emitAllNotificationsRead = (io, userId) => {
  if (!io || !userId) {
    console.warn('[Socket.io] Missing parameters for emitAllNotificationsRead')
    return
  }

  console.log(`[Socket.io] Marking all notifications as read for user ${userId}`)

  io.to(`user:${userId}`).emit('notification:readAll', {
    readAt: new Date().toISOString(),
  })
}

/**
 * Global io instance for use in job processors and other non-request contexts
 * Set during server initialization, accessed by BullMQ jobs
 */
let globalIoInstance = null

/**
 * Store the io instance for access from jobs and other modules
 * Called during server startup in app.js
 * @param {Socket.io.Server} io - The Socket.io server instance
 */
export const setGlobalIoInstance = (io) => {
  globalIoInstance = io
  console.log('[Socket.io] Global io instance set for job processors')
}

/**
 * Get the io instance from anywhere in the app
 * Useful for BullMQ job processors that can't access req.app.locals.io
 * @returns {Socket.io.Server | null}
 */
export const getGlobalIoInstance = () => {
  return globalIoInstance
}
