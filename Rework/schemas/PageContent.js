import mongoose from 'mongoose'

const pageSectionSchema = new mongoose.Schema(
    {
        heading: { type: String, trim: true },
        body:    { type: String, required: true, trim: true },
    },
    { _id: false },
)

const pageContentSchema = new mongoose.Schema(
    {
        pageKey:     { type: String, required: true, enum: ['about'], index: true, unique: true },
        title:       { type: String, trim: true },
        sections:    { type: [pageSectionSchema], default: [] },
        isPublished: { type: Boolean, default: false },
    },
    { timestamps: true },
)

const PageContent = mongoose.model('PageContent', pageContentSchema)
export default PageContent
