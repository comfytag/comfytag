import User from '../models/User.js'
import Audience from '../models/Audience.js'
import { createError } from '../utils/error.js'
import { createNotification } from './notification.js'

// POST /face/enroll/:userId
// Stores encrypted face template for a user
// Template is processed on-device by KBY-AI —
// server only stores the encrypted result
export const enrollFace = async (req, res, next) => {
  try {
    const { faceTemplate, deviceId } = req.body

    if (!faceTemplate) {
      return next(createError(400, 'Face template is required'))
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        faceEnrolled: true,
        faceTemplate,
        faceEnrolledAt: new Date(),
        faceEnrollmentDevice: deviceId || 'unknown',
      },
      { new: true }
    ).select('+faceTemplate')

    if (!user) return next(createError(404, 'User not found'))

    res.status(200).json({
      message: 'Face enrolled successfully',
      faceEnrolled: true,
      faceEnrolledAt: user.faceEnrolledAt,
    })

    // Create real-time notification confirming face enrollment
    const io = req.app.locals.io
    await createNotification({
      userId: req.params.userId,
      type: 'face_enrolled',
      title: 'Your face is ready ✓',
      message: 'Skip the queue at events — your face is your ticket now',
      data: {
        enrolledAt: user.faceEnrolledAt,
        deviceId: deviceId || 'unknown',
      },
      io,
    }).catch(err => console.error('[Notification] Face enrolled failed:', err.message))
  } catch (err) {
    next(err)
  }
}

// Compares a freshly captured face template against a stored one.
// TODO: Replace with a real KBY-AI biometric distance calculation when
// the SDK license arrives. This mock stand-in is NOT a security boundary —
// it exists only so the 1:N identification flow below has something to
// call until real matching is wired in.
const compareFaceTemplates = (captured, stored) => {
  return Boolean(captured) && Boolean(stored)
}

// POST /face/verify
// Identifies which (if any) face-enrolled attendee at this event matches
// a captured face — no ticket lookup needed beforehand. Called by the
// organizer's Face Check-In screen: point the camera at anyone, and the
// server searches every active, face-linked ticket for the event to find
// the match. This is what "your face is your ticket" actually means —
// contrast with QR/manual check-in, which already knows who it's for.
export const verifyFace = async (req, res, next) => {
  try {
    const { faceTemplate, eventId } = req.body

    if (!faceTemplate || !eventId) {
      return next(createError(400,
        'faceTemplate and eventId are required'))
    }

    // Every active ticket for this event with a face linked to it
    const tickets = await Audience.find({
      event_id: eventId,
      status: 'active',
      faceOwner: { $ne: null },
    })

    if (tickets.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No face-enrolled attendees found for this event',
      })
    }

    const ownerIds = [...new Set(tickets.map((t) => t.faceOwner))]
    const owners = await User.find({
      _id: { $in: ownerIds },
      faceEnrolled: true,
    }).select('+faceTemplate')
    const ownersById = new Map(owners.map((o) => [o._id.toString(), o]))

    let matchedTicket = null
    let matchedOwner = null
    for (const ticket of tickets) {
      const owner = ownersById.get(ticket.faceOwner)
      if (!owner) continue
      if (compareFaceTemplates(faceTemplate, owner.faceTemplate)) {
        matchedTicket = ticket
        matchedOwner = owner
        break
      }
    }

    if (!matchedTicket) {
      return res.status(200).json({
        success: false,
        message: 'Face did not match any enrolled attendee — entry denied',
      })
    }

    await Audience.findByIdAndUpdate(matchedTicket._id, {
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInMethod: 'face',
      status: 'used',
    })

    return res.status(200).json({
      success: true,
      message: 'Face matched — entry granted',
      attendeeName: matchedOwner.name,
      ticketType: matchedTicket.type,
    })
  } catch (err) {
    next(err)
  }
}

// DELETE /face/remove/:userId
// Removes face template — called on ticket transfer
export const removeFace = async (req, res, next) => {
  try {
    const requesterId = (req.user._id ?? req.user.id ?? '').toString()
    if (req.params.userId !== requesterId && !req.user.isAdmin) {
      return next(createError(403, 'You are not authorized to remove this face template'))
    }

    await User.findByIdAndUpdate(req.params.userId, {
      faceEnrolled: false,
      faceTemplate: null,
      faceEnrolledAt: null,
      faceEnrollmentDevice: null,
    })

    res.status(200).json({
      message: 'Face template removed successfully'
    })
  } catch (err) {
    next(err)
  }
}
