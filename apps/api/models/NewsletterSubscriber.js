import mongoose from 'mongoose'
const { Schema } = mongoose

const NewsletterSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Where the subscription came from — homepage box today, could be
    // event pages or other capture points later.
    source: {
      type: String,
      default: 'homepage',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema)
