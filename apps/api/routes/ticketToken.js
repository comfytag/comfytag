import express from 'express'
import { getTicketToken, getTicketStatus } from '../controllers/commerce.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// GET /tickets/:id/token — generate TOTP token for a ticket (auth)
router.get('/:id/token', verifyToken, getTicketToken)

// GET /tickets/:id/status — SSE stream of check-in status (auth)
router.get('/:id/status', verifyToken, getTicketStatus)

export default router
