import PromoBanner from '../models/PromoBanner.js'
import { createError } from '../utils/error.js'

// GET /cms/banners — public
// Supports optional ?key=<bannerKey> to filter to a specific banner.
export const getActiveBanners = async (req, res, next) => {
    try {
        const now = new Date()
        const filter = {
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
        }
        if (req.query.key) filter.bannerKey = req.query.key

        const banners = await PromoBanner.find(filter)
            .select('bannerKey title body targetPage targetAudience -_id')
        return res.status(200).json({ success: true, data: banners })
    } catch (err) {
        next(err)
    }
}

// POST /cms/banners — admin only
export const createBanner = async (req, res, next) => {
    try {
        const { bannerKey, title, body, isActive, targetPage, targetAudience, startsAt, expiresAt } = req.body
        if (!bannerKey?.trim() || !title?.trim() || !body?.trim()) {
            return next(createError(400, 'bannerKey, title, and body are required.'))
        }
        const banner = await PromoBanner.create({
            bannerKey, title, body, isActive, targetPage, targetAudience, startsAt, expiresAt,
        })
        return res.status(201).json({ success: true, data: banner })
    } catch (err) {
        next(err)
    }
}

// PUT /cms/banners/:id — admin only
export const updateBanner = async (req, res, next) => {
    try {
        const banner = await PromoBanner.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true },
        )
        if (!banner) return next(createError(404, 'Banner not found.'))
        return res.status(200).json({ success: true, data: banner })
    } catch (err) {
        next(err)
    }
}

// DELETE /cms/banners/:id — admin only
export const deleteBanner = async (req, res, next) => {
    try {
        const banner = await PromoBanner.findByIdAndDelete(req.params.id)
        if (!banner) return next(createError(404, 'Banner not found.'))
        return res.status(200).json({ success: true, message: 'Banner deleted.' })
    } catch (err) {
        next(err)
    }
}
