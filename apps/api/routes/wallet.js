import express from 'express'
import { getWallet } from '../controllers/commerce.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// GET /wallet — get authenticated user's wallet (auth)
router.get('/', verifyToken, getWallet)

export default router
