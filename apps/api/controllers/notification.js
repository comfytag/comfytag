import webpush from 'web-push'
import Notification from '../models/Notification.js'
import WebPushSubscription from '../models/WebPushSubscription.js'
import User from '../models/User.js'
import { createError } from '../utils/error.js'
import { emitNotification, emitUnreadCountUpdate, emitNotificationRead, emitAllNotificationsRead } from '../socket/index.js'

// ─── VAPID setup ─────────────────────────────────────────────────────────────
// Keys are generated once via: node scripts/generate-vapid-keys.js
// and stored in .env as VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@comfytag.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// Map notification type → deep-link URL for push notification click
const typeToUrl = (type, data = {}) => {
  switch (type) {
    case 'ticket_confirmed':
    case 'transfer_received':
    case 'transfer_accepted':
    case 'transfer_declined':
      return '/tickets'
    case 'event_reminder':
    case 'new_event_from_following':
      return data.eventId ? `/events/${data.eventId}` : '/events'
    case 'ticket_sold':
      return '/overview'
    case 'payout_approved':
    case 'payout_rejected':
      return '/withdraw'
    case 'kyc_approved':
    case 'kyc_rejected':
      return '/settings'
    case 'face_enrolled':
      return '/'
    case 'kyc_submitted':
      return data.userId ? `/kyc/${data.userId}` : '/kyc'
    case 'payout_requested':
      return '/payouts'
    case 'organizer_registered':
      return data.userId ? `/users/${data.userId}` : '/users'
    default:
      return '/notifications'
  }
}

// Send a Web Push notification to all active subscriptions for a user.
// Silently cleans up expired (410) subscriptions.
// Non-fatal — never throws.
const sendWebPushToUser = async (userId, { title, message, type, data = {} }) => {
  if (!process.env.VAPID_PUBLIC_KEY) return

  try {
    const subscriptions = await WebPushSubscription.find({ user_id: userId })
    if (!subscriptions.length) return

    const payload = JSON.stringify({
      title,
      message,
      type,
      data: { ...data, url: typeToUrl(type, data) },
    })

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload
          )
        } catch (err) {
          // 410 = subscription expired/revoked — remove it
          if (err.statusCode === 410) {
            await WebPushSubscription.deleteOne({ _id: sub._id })
          }
        }
      })
    )
  } catch (err) {
    console.error('[WebPush] sendWebPushToUser failed:', err.message)
  }
}

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

    // Emit Socket.io event for real-time notification (tab is open)
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

    // Web Push — delivers even when the tab is closed
    sendWebPushToUser(userId, { title, message, type, data })
  } catch (err) {
    // Non-fatal — log but don't crash the parent operation
    console.error('Failed to create notification:', err.message)
  }
}

// ─── Web Push subscription management ────────────────────────────────────────

// POST /notification/web-push/subscribe
// Store a browser push subscription for the logged-in user
export const subscribePush = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return next(createError(400, 'endpoint and keys (p256dh, auth) are required'))
    }

    // Upsert — same endpoint may re-subscribe after a browser restart
    await WebPushSubscription.updateOne(
      { user_id: req.user.id, endpoint },
      { user_id: req.user.id, endpoint, keys },
      { upsert: true }
    )

    res.status(200).json({ message: 'Push subscription saved' })
  } catch (err) {
    next(err)
  }
}

// DELETE /notification/web-push/unsubscribe
// Remove a browser push subscription (called on logout or permission revoke)
export const unsubscribePush = async (req, res, next) => {
  try {
    const { endpoint } = req.body

    if (!endpoint) {
      return next(createError(400, 'endpoint is required'))
    }

    await WebPushSubscription.deleteOne({ user_id: req.user.id, endpoint })

    res.status(200).json({ message: 'Push subscription removed' })
  } catch (err) {
    next(err)
  }
}

// ─── Admin notification helper ────────────────────────────────────────────────
// Finds all admin users matching the given role(s) and sends each one a
// notification. Roles are AND-ed with isAdmin: true.
// Passing roles: [] sends to ALL admins (super_admin gets everything).
// Non-fatal — a failure here never blocks the parent operation.
export const notifyAdmins = async ({ roles = [], type, title, message, data = {}, io = null }) => {
  try {
    const filter = { isAdmin: true }
    if (roles.length > 0) {
      // Always include super_admin regardless of the role filter
      filter.$or = [
        { role: { $in: roles } },
        { role: 'super_admin' },
      ]
    }

    const admins = await User.find(filter).select('_id').lean()

    await Promise.allSettled(
      admins.map((admin) =>
        createNotification({ userId: admin._id.toString(), type, title, message, data, io })
      )
    )
  } catch (err) {
    console.error('[notifyAdmins] Failed:', err.message)
  }
}
