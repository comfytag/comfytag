import LegalDocument from '../models/LegalDocument.js'
import PageContent from '../models/PageContent.js'
import { createError } from '../utils/error.js'

// GET /cms/legal/:docType — public
export const getLegalDocument = async (req, res, next) => {
    try {
        const { docType } = req.params
        if (!['terms', 'privacy'].includes(docType)) {
            return next(createError(400, 'docType must be "terms" or "privacy".'))
        }
        const doc = await LegalDocument.findOne({ docType }).select('-__v')
        if (!doc) return res.status(200).json({ success: true, data: null })
        return res.status(200).json({ success: true, data: doc })
    } catch (err) {
        next(err)
    }
}

// PUT /cms/legal/:docType — admin (upsert)
export const upsertLegalDocument = async (req, res, next) => {
    try {
        const { docType } = req.params
        if (!['terms', 'privacy'].includes(docType)) {
            return next(createError(400, 'docType must be "terms" or "privacy".'))
        }
        const { lastUpdated, version, sections } = req.body
        if (!lastUpdated) {
            return next(createError(400, 'lastUpdated is required.'))
        }
        const doc = await LegalDocument.findOneAndUpdate(
            { docType },
            { docType, lastUpdated, version, sections },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        )
        return res.status(200).json({ success: true, data: doc })
    } catch (err) {
        next(err)
    }
}

// GET /cms/pages/:key — public
export const getPageContent = async (req, res, next) => {
    try {
        const { key } = req.params
        if (!['about'].includes(key)) {
            return next(createError(400, 'Page key not recognised.'))
        }
        const doc = await PageContent.findOne({ pageKey: key, isPublished: true }).select('-__v')
        if (!doc) return res.status(200).json({ success: true, data: null })
        return res.status(200).json({ success: true, data: doc })
    } catch (err) {
        next(err)
    }
}

// PUT /cms/pages/:key — admin (upsert)
export const upsertPageContent = async (req, res, next) => {
    try {
        const { key } = req.params
        if (!['about'].includes(key)) {
            return next(createError(400, 'Page key not recognised.'))
        }
        const { title, sections, isPublished } = req.body
        const doc = await PageContent.findOneAndUpdate(
            { pageKey: key },
            { pageKey: key, title, sections, isPublished },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        )
        return res.status(200).json({ success: true, data: doc })
    } catch (err) {
        next(err)
    }
}
