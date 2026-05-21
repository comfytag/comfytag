import express from 'express'
import { getSearchSuggestions, getTrending } from '../controllers/commerce.js'

const router = express.Router()

// GET /search/suggestions — typeahead suggestions (public)
router.get('/suggestions', getSearchSuggestions)

// GET /search/trending — trending events (public)
router.get('/trending', getTrending)

export default router
