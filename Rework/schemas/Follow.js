import mongoose from 'mongoose'

const FollowSchema = new mongoose.Schema(
  {
    follower_id: {
      type: String,
      required: true,
      index: true,
    },
    organizer_id: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
)

// Prevent duplicate follows: one user can only follow an organizer once
FollowSchema.index({ follower_id: 1, organizer_id: 1 }, { unique: true })

export default mongoose.model('Follow', FollowSchema)
