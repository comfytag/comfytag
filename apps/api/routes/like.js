import express from 'express'
import { toggleLike, getLikeStatus, getSavedEvents } from '../controllers/social.js'
import { verifyToken, optionalAuth } from '../utils/verifyToken.js'

const router = express.Router()

// GET /events/saved — all events the user has liked/saved (auth)
router.get('/saved', verifyToken, getSavedEvents)

// GET /events/:id/like/status — public; optional auth for personalised liked flag
router.get('/:id/like/status', optionalAuth, getLikeStatus)

// POST /events/:id/like — toggle like (auth)
router.post('/:id/like', verifyToken, toggleLike)

export default router
