import mongoose from 'mongoose'

const marqueeItemSchema = new mongoose.Schema(
    {
        text:       { type: String, required: true, trim: true },
        pulse:      { type: Boolean, default: false },
        dotColor:   { type: String, enum: ['red', 'violet'], default: 'violet' },
        isActive:   { type: Boolean, default: true },
        cityTarget: { type: String, trim: true },
        sortOrder:  { type: Number, default: 0 },
        startsAt:   { type: Date },
        expiresAt:  { type: Date },
    },
    { timestamps: true },
)

const MarqueeItem = mongoose.model('MarqueeItem', marqueeItemSchema)
export default MarqueeItem
