import HowItWorksStep from '../models/HowItWorksStep.js'
import { createError } from '../utils/error.js'

// GET /cms/how-it-works — public
export const getActiveSteps = async (_req, res, next) => {
    try {
        const steps = await HowItWorksStep.find({ isActive: true })
            .select('stepNumber title description iconType isComingSoon -_id')
            .sort({ sortOrder: 1, stepNumber: 1 })
        return res.status(200).json({ success: true, data: steps })
    } catch (err) {
        next(err)
    }
}

// GET /cms/how-it-works/all — admin only
// Returns every document regardless of isActive, with _id included.
export const getAllSteps = async (_req, res, next) => {
    try {
        const steps = await HowItWorksStep.find({}).sort({ sortOrder: 1, stepNumber: 1 })
        return res.status(200).json({ success: true, data: steps })
    } catch (err) {
        next(err)
    }
}

// POST /cms/how-it-works — admin only
export const createStep = async (req, res, next) => {
    try {
        const { stepNumber, title, description, iconType, isComingSoon, isActive, sortOrder } = req.body
        if (!title?.trim() || !description?.trim() || !iconType?.trim()) {
            return next(createError(400, 'title, description, and iconType are required.'))
        }
        const step = await HowItWorksStep.create({
            stepNumber, title, description, iconType, isComingSoon, isActive, sortOrder,
        })
        return res.status(201).json({ success: true, data: step })
    } catch (err) {
        next(err)
    }
}

// PUT /cms/how-it-works/:id — admin only
export const updateStep = async (req, res, next) => {
    try {
        const step = await HowItWorksStep.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true },
        )
        if (!step) return next(createError(404, 'Step not found.'))
        return res.status(200).json({ success: true, data: step })
    } catch (err) {
        next(err)
    }
}

// DELETE /cms/how-it-works/:id — admin only
export const deleteStep = async (req, res, next) => {
    try {
        const step = await HowItWorksStep.findByIdAndDelete(req.params.id)
        if (!step) return next(createError(404, 'Step not found.'))
        return res.status(200).json({ success: true, message: 'Step deleted.' })
    } catch (err) {
        next(err)
    }
}
