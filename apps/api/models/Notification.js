import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ticket_confirmed',
        'transfer_received',
        'transfer_accepted',
        'transfer_declined',
        'event_reminder',
        'new_event_from_following',
        'payout_approved',
        'payout_rejected',
        'kyc_approved',
        'kyc_rejected',
        'face_enrolled',
        'ticket_sold',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      // Flexible payload for deep linking
      // e.g. { ticketId: '...', eventId: '...' }
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

// Compound index for efficient user notification queries
NotificationSchema.index({ user_id: 1, read: 1, createdAt: -1 })

// Auto-delete notifications older than 90 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
)

export default mongoose.model('Notification', NotificationSchema)
