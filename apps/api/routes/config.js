import express from 'express'
import { getSeasonalConfig } from '../controllers/commerce.js'
import { getPublicSiteConfig } from '../controllers/siteConfig.js'

const router = express.Router()

// GET /config/seasonal — seasonal feature flags (public)
router.get('/seasonal', getSeasonalConfig)

// GET /config/site — public CMS config (supportEmail, hero copy, stats)
router.get('/site', getPublicSiteConfig)

export default router
