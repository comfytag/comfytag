import express from 'express'
import { postComment, getComments } from '../controllers/social.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// POST /events/:id/comments — post a comment (auth)
router.post('/:id/comments', verifyToken, postComment)

// GET /events/:id/comments — get paginated comments (public)
router.get('/:id/comments', getComments)

export default router
