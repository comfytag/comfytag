import express from 'express'
import { toggleFollow, getFollowStatus, getOrganizerStats } from '../controllers/social.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// GET /organizers/:id/follow/status — public
router.get('/:id/follow/status', getFollowStatus)

// GET /organizers/:id/stats — public
router.get('/:id/stats', getOrganizerStats)

// POST /organizers/:id/follow — toggle follow (auth)
router.post('/:id/follow', verifyToken, toggleFollow)

export default router
