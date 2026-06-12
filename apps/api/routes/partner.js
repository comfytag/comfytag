import express from 'express'
import { getKycStatus } from '../controllers/partner.js'
import { verifyUser } from '../utils/verifyToken.js'

const router = express.Router()

// GET /partner/kyc/:userId — Returns only KYC verification status
router.get('/kyc/:userId', verifyUser, getKycStatus)

export default router
