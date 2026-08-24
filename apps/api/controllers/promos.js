import Event from '../models/Event.js'
import { createError } from '../utils/error.js'
import crypto from 'crypto'

// Throws a 403 unless requester is admin or the event's own planner.
const assertOwnsEvent = (event, req) => {
  if (req.user.isAdmin) return
  const requesterId = (req.user._id ?? req.user.id ?? '').toString()
  if (event.planner_id?.toString() !== requesterId) {
    throw createError(403, 'Not authorized to manage promo codes for this event')
  }
}

// POST /events/:id/promos
// Create a new promo code for an event
export const createPromoCode = async (req, res, next) => {
  try {
    const eventId = req.params.id
    const { code, discountType, discountValue, maxUses, expiresAt } = req.body

    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return next(createError(400, 'code, discountType, and discountValue are required'))
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return next(createError(400, 'discountType must be "percentage" or "fixed"'))
    }

    const event = await Event.findById(eventId)
    if (!event) return next(createError(404, 'Event not found'))
    assertOwnsEvent(event, req)

    // Check if code already exists in this event
    if (event.promos.some(p => p.code === code)) {
      return next(createError(409, 'Promo code already exists for this event'))
    }

    // Add promo to event
    const newPromo = {
      code,
      discountType,
      discountValue,
      maxUses: maxUses || null,
      usedCount: 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    }

    event.promos.push(newPromo)
    const updated = await event.save()

    const createdPromo = updated.promos[updated.promos.length - 1]

    res.status(201).json({
      message: 'Promo code created',
      promoCode: createdPromo,
    })
  } catch (err) {
    next(err)
  }
}

// GET /events/:id/promos
// List all promo codes for an event
export const getPromoCodesForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id

    const event = await Event.findById(eventId)
    if (!event) return next(createError(404, 'Event not found'))

    res.status(200).json({
      eventId,
      promoCodes: event.promos || [],
    })
  } catch (err) {
    next(err)
  }
}

// PUT /events/:id/promos/:code
// Update a promo code
export const updatePromoCode = async (req, res, next) => {
  try {
    const { id: eventId, code: codeToUpdate } = req.params
    const { discountValue, maxUses, expiresAt, isActive } = req.body

    const event = await Event.findById(eventId)
    if (!event) return next(createError(404, 'Event not found'))
    assertOwnsEvent(event, req)

    const promo = event.promos.find(p => p.code === codeToUpdate)
    if (!promo) return next(createError(404, 'Promo code not found'))

    // Update allowed fields
    if (discountValue !== undefined) promo.discountValue = discountValue
    if (maxUses !== undefined) promo.maxUses = maxUses
    if (expiresAt !== undefined) promo.expiresAt = new Date(expiresAt)
    if (isActive !== undefined) promo.isActive = isActive

    await event.save()

    res.status(200).json({
      message: 'Promo code updated',
      promoCode: promo,
    })
  } catch (err) {
    next(err)
  }
}

// POST /promo/validate
// Public endpoint — validate a promo code at checkout
export const validatePromoCode = async (req, res, next) => {
  try {
    const { code, eventId } = req.body

    if (!code || !eventId) {
      return next(createError(400, 'code and eventId are required'))
    }

    const event = await Event.findById(eventId)
    if (!event) return next(createError(404, 'Event not found'))

    const promo = event.promos.find(
      (p) => p.code.toLowerCase() === code.trim().toLowerCase()
    )

    if (!promo) return next(createError(404, 'Invalid or expired code'))
    if (!promo.isActive) return next(createError(400, 'Invalid or expired code'))
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return next(createError(400, 'Invalid or expired code'))
    }
    if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
      return next(createError(400, 'Invalid or expired code'))
    }

    res.status(200).json({
      discountType: promo.discountType,
      discountValue: promo.discountValue,
    })
  } catch (err) {
    next(err)
  }
}

// DELETE /events/:id/promos/:code
// Delete a promo code
export const deletePromoCode = async (req, res, next) => {
  try {
    const { id: eventId, code: codeToDelete } = req.params

    const event = await Event.findById(eventId)
    if (!event) return next(createError(404, 'Event not found'))
    assertOwnsEvent(event, req)

    const promoIndex = event.promos.findIndex(p => p.code === codeToDelete)
    if (promoIndex === -1) return next(createError(404, 'Promo code not found'))

    event.promos.splice(promoIndex, 1)
    await event.save()

    res.status(200).json({
      message: 'Promo code deleted',
    })
  } catch (err) {
    next(err)
  }
}
