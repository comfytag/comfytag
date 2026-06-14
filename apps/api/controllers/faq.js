import FaqItem from '../models/FaqItem.js'
import { createError } from '../utils/error.js'

// GET /cms/faqs — public, active items sorted by sortOrder
export const getActiveFaqs = async (_req, res, next) => {
    try {
        const items = await FaqItem.find({ isActive: true })
            .select('question answer category -_id')
            .sort({ sortOrder: 1 })
        return res.status(200).json({ success: true, data: items })
    } catch (err) {
        next(err)
    }
}

// POST /cms/faqs — admin only
export const createFaq = async (req, res, next) => {
    try {
        const { question, answer, category, sortOrder, isActive } = req.body
        if (!question?.trim() || !answer?.trim()) {
            return next(createError(400, 'question and answer are required.'))
        }
        const item = await FaqItem.create({ question, answer, category, sortOrder, isActive })
        return res.status(201).json({ success: true, data: item })
    } catch (err) {
        next(err)
    }
}

// PUT /cms/faqs/:id — admin only
export const updateFaq = async (req, res, next) => {
    try {
        const item = await FaqItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true },
        )
        if (!item) return next(createError(404, 'FAQ not found.'))
        return res.status(200).json({ success: true, data: item })
    } catch (err) {
        next(err)
    }
}

// DELETE /cms/faqs/:id — admin only
export const deleteFaq = async (req, res, next) => {
    try {
        const item = await FaqItem.findByIdAndDelete(req.params.id)
        if (!item) return next(createError(404, 'FAQ not found.'))
        return res.status(200).json({ success: true, message: 'FAQ deleted.' })
    } catch (err) {
        next(err)
    }
}
