import Notification from '../models/Notification.js'
import { createError } from '../utils/error.js'

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
    res.status(200).json({ message: 'All notifications marked as read' })
  } catch (err) {
    next(err)
  }
}

// Helper function — used by other controllers to
// create notifications programmatically
// NOT exposed as a route
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
}) => {
  try {
    await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      data
    })
  } catch (err) {
    // Non-fatal — log but don't crash the parent operation
    console.error('Failed to create notification:', err.message)
  }
}
