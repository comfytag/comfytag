import express from 'express'
import rateLimit from 'express-rate-limit'
import { subscribeToNewsletter } from '../controllers/newsletter.js'

const router = express.Router()

// Public, unauthenticated endpoint — rate-limited to deter spam/abuse
const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
})

// POST /newsletter/subscribe
router.post('/subscribe', subscribeLimiter, subscribeToNewsletter)

export default router
