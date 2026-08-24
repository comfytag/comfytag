import mongoose from 'mongoose'
const { Schema } = mongoose

const ReferralSchema = new Schema(
  {
    referrer_id: { type: String, required: true, index: true },
    event_id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    uses: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    total_credited: { type: Number, default: 0 },
  },
  { timestamps: true }
)

ReferralSchema.index({ referrer_id: 1, event_id: 1 }, { unique: true })

export default mongoose.model('Referral', ReferralSchema)
