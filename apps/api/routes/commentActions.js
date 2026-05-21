import express from 'express'
import { deleteComment, pinComment, reportComment } from '../controllers/social.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// DELETE /comments/:id — soft-delete a comment (auth)
router.delete('/:id', verifyToken, deleteComment)

// POST /comments/:id/pin — pin a comment (auth, organizer only)
router.post('/:id/pin', verifyToken, pinComment)

// POST /comments/:id/report — report a comment (auth)
router.post('/:id/report', verifyToken, reportComment)

export default router
