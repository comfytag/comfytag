import express from 'express'
import { searchEvents } from '../controllers/commerce.js'

const router = express.Router()

// GET /events/search — full-text + filter search (public)
router.get('/search', searchEvents)

export default router
