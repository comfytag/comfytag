import express from 'express'
import { getPartnerRevenue, getEventAnalytics, getPartnerAnalytics, getCheckInStats } from '../controllers/analytics.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// GET /partner/:userId/revenue — partner real balance
router.get('/partner/:userId/revenue', verifyToken, getPartnerRevenue)

// GET /events/:id/analytics — per-event analytics
router.get('/events/:id/analytics', verifyToken, getEventAnalytics)

// GET /partner/:userId/analytics — partner lifetime analytics
router.get('/partner/:userId/analytics', verifyToken, getPartnerAnalytics)

// GET /events/:id/checkin-stats — real-time check-in stats
router.get('/events/:id/checkin-stats', verifyToken, getCheckInStats)

export default router
