import mongoose from 'mongoose'

const howItWorksStepSchema = new mongoose.Schema(
    {
        stepNumber:   { type: Number, required: true },
        title:        { type: String, required: true, trim: true },
        description:  { type: String, required: true, trim: true },
        iconType:     { type: String, required: true, trim: true },
        isComingSoon: { type: Boolean, default: false },
        isActive:     { type: Boolean, default: true },
        sortOrder:    { type: Number, default: 0 },
    },
    { timestamps: true },
)

const HowItWorksStep = mongoose.model('HowItWorksStep', howItWorksStepSchema)
export default HowItWorksStep
