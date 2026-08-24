import mongoose from 'mongoose'

const EventLikeSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    event_id: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
)

// Prevent duplicate likes: one user can only like an event once
EventLikeSchema.index({ user_id: 1, event_id: 1 }, { unique: true })

export default mongoose.model('EventLike', EventLikeSchema)
