import Notification from '../models/Notification.js'
import { createError } from '../utils/error.js'
import { emitNotification, emitUnreadCountUpdate, emitNotificationRead, emitAllNotificationsRead } from '../socket/index.js'

// GET /notifications
// Get notifications for logged-in user
// Supports ?unread=true to filter unread only
// Supports ?limit=20&page=1 for pagination
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { unread, limit = 20, page = 1 } = req.query

    const query = { user_id: userId }
    if (unread === 'true') query.read = false

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Notification.countDocuments(query),
      Notification.countDocuments({
        user_id: userId,
        read: false
      }),
    ])

    res.status(200).json({
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      hasMore: skip + notifications.length < total,
    })
  } catch (err) {
    next(err)
  }
}

// PUT /notifications/:id/read
// Mark a single notification as read
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

    // Emit Socket.io event for real-time update
    const io = req.app.locals.io
    if (io) {
      emitNotificationRead(io, req.user.id, req.params.id)

      // Get updated unread count and broadcast
      const unreadCount = await Notification.countDocuments({
        user_id: req.user.id,
        read: false,
      })
      emitUnreadCountUpdate(io, req.user.id, unreadCount)
    }

    res.status(200).json({ message: 'Marked as read', notification })
  } catch (err) {
    next(err)
  }
}

// PUT /notifications/read-all
// Mark all notifications as read for logged-in user
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, read: false },
      { read: true }
    )

    // Emit Socket.io event for real-time update
    const io = req.app.locals.io
    if (io) {
      emitAllNotificationsRead(io, req.user.id)
      // Unread count is now 0
      emitUnreadCountUpdate(io, req.user.id, 0)
    }

    res.status(200).json({ message: 'All notifications marked as read' })
  } catch (err) {
    next(err)
  }
}

// Helper function — used by other controllers to
// create notifications programmatically
// NOT exposed as a route
// Accepts optional `io` instance for Socket.io emissions
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  io = null, // Optional Socket.io instance
}) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      data
    })

    // Emit Socket.io event for real-time notification
    if (io) {
      emitNotification(io, userId, {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: notification.read,
        createdAt: notification.createdAt,
      })

      // Update unread count for user
      const unreadCount = await Notification.countDocuments({
        user_id: userId,
        read: false,
      })
      emitUnreadCountUpdate(io, userId, unreadCount)
    }
  } catch (err) {
    // Non-fatal — log but don't crash the parent operation
    console.error('Failed to create notification:', err.message)
  }
}
