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

// POST /face/verify
// Matches a face template against a ticket owner
// Called by organizer check-in screen
export const verifyFace = async (req, res, next) => {
  try {
    const { faceTemplate, ticketId } = req.body

    if (!faceTemplate || !ticketId) {
      return next(createError(400,
        'faceTemplate and ticketId are required'))
    }

    // Get ticket and its face owner
    const ticket = await Audience.findById(ticketId)
    if (!ticket) return next(createError(404, 'Ticket not found'))
    if (ticket.status !== 'active') {
      return next(createError(400,
        `Ticket is ${ticket.status} — entry not permitted`))
    }
    if (!ticket.faceOwner) {
      return next(createError(400,
        'No face linked to this ticket'))
    }

    // Get the face template of the ticket owner
    const owner = await User.findById(ticket.faceOwner)
      .select('+faceTemplate')
    if (!owner || !owner.faceEnrolled) {
      return next(createError(400,
        'Ticket owner has no enrolled face'))
    }

    // NOTE: Actual face comparison is done on-device
    // by the KBY-AI SDK before this endpoint is called.
    // This endpoint records the check-in result and
    // updates the ticket — it does NOT perform the
    // biometric comparison itself.
    const { matchResult, matchScore } = req.body

    if (matchResult === true) {
      // Mark ticket as used / checked in
      await Audience.findByIdAndUpdate(ticketId, {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInMethod: 'face',
        status: 'used',
      })

      return res.status(200).json({
        success: true,
        message: 'Face matched — entry granted',
        attendeeName: owner.name,
        ticketType: ticket.type,
      })
    } else {
      return res.status(200).json({
        success: false,
        message: 'Face did not match — entry denied',
      })
    }
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
