import mongoose from 'mongoose'

const siteConfigSchema = new mongoose.Schema(
    {
        supportEmail:  { type: String, default: 'support@comfytag.com', trim: true },
        heroHeadline:  { type: String, trim: true },
        heroSubtitle:  { type: String, trim: true },
        statAttendees: { type: String, trim: true },
        statEvents:    { type: String, trim: true },
        statCities:    { type: String, trim: true },
    },
    { timestamps: true },
)

const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema)
export default SiteConfig
