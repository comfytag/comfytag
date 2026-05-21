import express from 'express'
import { createAlert } from '../controllers/commerce.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// POST /alerts — create or upsert an alert (auth)
router.post('/', verifyToken, createAlert)

export default router
