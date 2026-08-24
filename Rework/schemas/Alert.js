import mongoose from 'mongoose'
const { Schema } = mongoose

const AlertSchema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['artist', 'organizer', 'category'],
      required: true,
    },
    value: { type: String, required: true },
    triggered: { type: Boolean, default: false },
  },
  { timestamps: true }
)

AlertSchema.index({ user_id: 1, type: 1, value: 1 }, { unique: true })

export default mongoose.model('Alert', AlertSchema)
