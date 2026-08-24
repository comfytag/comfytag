import mongoose from 'mongoose'

const sectionSchema = new mongoose.Schema(
    {
        heading: { type: String, required: true, trim: true },
        body:    { type: String, required: true, trim: true },
    },
    { _id: false },
)

const legalDocumentSchema = new mongoose.Schema(
    {
        docType:     { type: String, required: true, enum: ['terms', 'privacy'], index: true, unique: true },
        lastUpdated: { type: String, required: true },
        version:     { type: String },
        sections:    { type: [sectionSchema], default: [] },
    },
    { timestamps: true },
)

const LegalDocument = mongoose.model('LegalDocument', legalDocumentSchema)
export default LegalDocument
