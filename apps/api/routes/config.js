import express from 'express'
import { getSeasonalConfig } from '../controllers/commerce.js'

const router = express.Router()

// GET /config/seasonal — seasonal feature flags (public)
router.get('/seasonal', getSeasonalConfig)

export default router
