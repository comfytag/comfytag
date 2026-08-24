import mongoose from 'mongoose'

const WebPushSubscriptionSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
)

// One subscription object per endpoint — prevent duplicates across re-subscribes
WebPushSubscriptionSchema.index({ user_id: 1, endpoint: 1 }, { unique: true })

export default mongoose.model('WebPushSubscription', WebPushSubscriptionSchema)
