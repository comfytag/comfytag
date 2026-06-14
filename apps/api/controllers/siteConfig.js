import SiteConfig from '../models/SiteConfig.js'

// GET /config/site — public, unauthenticated
// Returns only the fields safe to expose to the web app (no internal admin fields).
export const getPublicSiteConfig = async (_req, res, next) => {
    try {
        const doc = await SiteConfig.findOne({}).select(
            'supportEmail heroHeadline heroSubtitle statAttendees statEvents statCities -_id',
        )

        const data = doc ?? {
            supportEmail:  'support@comfytag.com',
            heroHeadline:  null,
            heroSubtitle:  null,
            statAttendees: null,
            statEvents:    null,
            statCities:    null,
        }

        return res.status(200).json({ success: true, data })
    } catch (err) {
        next(err)
    }
}
