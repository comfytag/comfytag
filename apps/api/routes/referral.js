import express from 'express'
import { getReferralCode, applyReferral } from '../controllers/commerce.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// POST /referral/apply — apply a referral code to a ticket (auth)
// Must come before /:eventId to avoid route conflict
router.post('/apply', verifyToken, applyReferral)

// GET /referral/:eventId — get or create referral code for an event (auth)
router.get('/:eventId', verifyToken, getReferralCode)

export default router
