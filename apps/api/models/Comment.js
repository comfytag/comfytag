import mongoose from 'mongoose'

const CommentSchema = new mongoose.Schema(
  {
    event_id: {
      type: String,
      required: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 500,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

export default mongoose.model('Comment', CommentSchema)
