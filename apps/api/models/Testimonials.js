import mongoose from 'mongoose'
const { Schema } = mongoose

const TestimonialSchema = new Schema(
    {
        // Canonical fields
        userName:     { type: String, required: true, trim: true },
        userImage:    { type: String },
        quote:        { type: String, required: true },
        rating:       { type: Number, default: 5, min: 1, max: 5 },
        dateAttended: { type: Date },
        isApproved:   { type: Boolean, default: false, index: true },
        isFeatured:   { type: Boolean, default: false },
        sortOrder:    { type: Number, default: 0 },
        // Legacy aliases kept so existing documents continue to serialize
        name:         { type: String },
        text:         { type: String },
    },
    { timestamps: true },
)

export default mongoose.model('Testimonial', TestimonialSchema)