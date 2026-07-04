import express from 'express'
import { toggleFollow, getFollowStatus, getOrganizerStats, getMyFollowing } from '../controllers/social.js'
import { verifyToken, optionalAuth } from '../utils/verifyToken.js'

const router = express.Router()

// GET /organizers/following — organizers the authenticated user follows
// (must come before /:id routes so "following" isn't matched as an id)
router.get('/following', verifyToken, getMyFollowing)

// GET /organizers/:id/follow/status — public; optional auth for personalised following flag
router.get('/:id/follow/status', optionalAuth, getFollowStatus)

// GET /organizers/:id/stats — public
router.get('/:id/stats', getOrganizerStats)

// POST /organizers/:id/follow — toggle follow (auth)
router.post('/:id/follow', verifyToken, toggleFollow)

export default router
