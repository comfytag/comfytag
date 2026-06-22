import mongoose from 'mongoose'

const promoBannerSchema = new mongoose.Schema(
    {
        bannerKey:      { type: String, required: true, trim: true, index: true },
        title:          { type: String, required: true, trim: true },
        body:           { type: String, required: true, trim: true },
        isActive:       { type: Boolean, default: true },
        targetPage:     { type: String, trim: true },
        targetAudience: { type: String, trim: true },
        startsAt:       { type: Date },
        expiresAt:      { type: Date },
    },
    { timestamps: true },
)

const PromoBanner = mongoose.model('PromoBanner', promoBannerSchema)
export default PromoBanner
