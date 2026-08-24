import mongoose from 'mongoose'

const faqItemSchema = new mongoose.Schema(
    {
        question:  { type: String, required: true, trim: true },
        answer:    { type: String, required: true, trim: true },
        category:  { type: String, trim: true },
        sortOrder: { type: Number, default: 0 },
        isActive:  { type: Boolean, default: true, index: true },
    },
    { timestamps: true },
)

const FaqItem = mongoose.model('FaqItem', faqItemSchema)
export default FaqItem
