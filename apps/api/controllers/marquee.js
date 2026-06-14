import MarqueeItem from '../models/MarqueeItem.js'
import { createError } from '../utils/error.js'

// GET /cms/marquee — public
// Returns active, non-expired, already-started items ordered by sortOrder.
export const getActiveMarqueeItems = async (_req, res, next) => {
    try {
        const now = new Date()
        const items = await MarqueeItem.find({
            isActive: true,
            $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }],
            $and: [
                {
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: null },
                        { expiresAt: { $gt: now } },
                    ],
                },
            ],
        })
            .select('text pulse dotColor -_id')
            .sort({ sortOrder: 1 })

        return res.status(200).json({ success: true, data: items })
    } catch (err) {
        next(err)
    }
}

// POST /cms/marquee — admin only
export const createMarqueeItem = async (req, res, next) => {
    try {
        const { text, pulse, dotColor, isActive, cityTarget, sortOrder, startsAt, expiresAt } = req.body
        if (!text?.trim()) return next(createError(400, 'text is required.'))
        const item = await MarqueeItem.create({
            text, pulse, dotColor, isActive, cityTarget, sortOrder, startsAt, expiresAt,
        })
        return res.status(201).json({ success: true, data: item })
    } catch (err) {
        next(err)
    }
}

// PUT /cms/marquee/:id — admin only
export const updateMarqueeItem = async (req, res, next) => {
    try {
        const item = await MarqueeItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true },
        )
        if (!item) return next(createError(404, 'Marquee item not found.'))
        return res.status(200).json({ success: true, data: item })
    } catch (err) {
        next(err)
    }
}

// DELETE /cms/marquee/:id — admin only
export const deleteMarqueeItem = async (req, res, next) => {
    try {
        const item = await MarqueeItem.findByIdAndDelete(req.params.id)
        if (!item) return next(createError(404, 'Marquee item not found.'))
        return res.status(200).json({ success: true, message: 'Marquee item deleted.' })
    } catch (err) {
        next(err)
    }
}
