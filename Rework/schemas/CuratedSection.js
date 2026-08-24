import mongoose from 'mongoose'

const curatedSectionSchema = new mongoose.Schema(
    {
        sectionKey: { type: String, required: true, trim: true, unique: true, index: true },
        title:      { type: String, required: true, trim: true },
        eyebrow:    { type: String, trim: true, default: '' },
        isActive:   { type: Boolean, default: true },
        maxItems:   { type: Number, default: 8, min: 1, max: 20 },
    },
    { timestamps: true },
)

const CuratedSection = mongoose.model('CuratedSection', curatedSectionSchema)
export default CuratedSection
