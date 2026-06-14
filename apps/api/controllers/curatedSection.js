import CuratedSection from '../models/CuratedSection.js'
import { createError } from '../utils/error.js'

// GET /cms/curated-sections/:key — public
export const getCuratedSection = async (req, res, next) => {
    try {
        const doc = await CuratedSection.findOne({ sectionKey: req.params.key }).select('-__v')
        if (!doc) return res.status(200).json({ success: true, data: null })
        return res.status(200).json({ success: true, data: doc })
    } catch (err) {
        next(err)
    }
}

// PUT /cms/curated-sections/:key — admin only (upsert)
export const upsertCuratedSection = async (req, res, next) => {
    try {
        const { key } = req.params
        const { title, eyebrow, isActive, maxItems } = req.body
        if (!title?.trim()) {
            return next(createError(400, 'title is required.'))
        }
        const doc = await CuratedSection.findOneAndUpdate(
            { sectionKey: key },
            { sectionKey: key, title, eyebrow, isActive, maxItems },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        )
        return res.status(200).json({ success: true, data: doc })
    } catch (err) {
        next(err)
    }
}
