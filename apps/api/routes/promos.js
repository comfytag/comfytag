import express from 'express'
import { createPromoCode, getPromoCodesForEvent, updatePromoCode, deletePromoCode, validatePromoCode } from '../controllers/promos.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// POST /promo/validate — public, used at checkout
router.post('/promo/validate', validatePromoCode)

// POST /events/:id/promos — create promo
router.post('/events/:id/promos', verifyToken, createPromoCode)

// GET /events/:id/promos — list promos
router.get('/events/:id/promos', verifyToken, getPromoCodesForEvent)

// PUT /events/:id/promos/:code — update promo
router.put('/events/:id/promos/:code', verifyToken, updatePromoCode)

// DELETE /events/:id/promos/:code — delete promo
router.delete('/events/:id/promos/:code', verifyToken, deletePromoCode)

export default router
