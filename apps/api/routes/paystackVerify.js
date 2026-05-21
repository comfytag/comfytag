import express from 'express'
import { verifyPaystackPayment } from '../controllers/commerce.js'

const router = express.Router()

// POST /paystack/verify/:reference — verify a Paystack transaction (public)
router.post('/verify/:reference', verifyPaystackPayment)

export default router
