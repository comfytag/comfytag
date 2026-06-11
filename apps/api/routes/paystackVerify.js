import express from 'express'
import { verifyPaystackPayment, handlePaystackWebhook } from '../controllers/commerce.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// POST /paystack/verify/:reference — requires auth to prevent reference enumeration
router.post('/verify/:reference', verifyToken, verifyPaystackPayment)

// POST /paystack/webhook — no JWT auth (Paystack server-to-server); HMAC validated in controller
router.post('/webhook', handlePaystackWebhook)

export default router
