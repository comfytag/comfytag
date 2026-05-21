import Audience from '../models/Audience.js'
import User from '../models/User.js'
import { createError } from '../utils/error.js'
import crypto from 'crypto'

// POST /tickets/transfer/initiate
// Ticket owner initiates a transfer to another user
export const initiateTransfer = async (req, res, next) => {
  try {
    const { ticketId, recipientEmail, recipientPhone } = req.body
    const senderId = req.user.id

    if (!ticketId || (!recipientEmail && !recipientPhone)) {
      return next(createError(400,
        'ticketId and recipient contact required'))
    }

    // Verify ticket belongs to sender
    const ticket = await Audience.findById(ticketId)
    if (!ticket) return next(createError(404, 'Ticket not found'))
    if (ticket.user_id.toString() !== senderId) {
      return next(createError(403,
        'You do not own this ticket'))
    }
    if (ticket.status !== 'active') {
      return next(createError(400,
        `Cannot transfer a ${ticket.status} ticket`))
    }

    // Find recipient
    const query = recipientEmail
      ? { email: recipientEmail }
      : { phone: recipientPhone }
    const recipient = await User.findOne(query)
    if (!recipient) {
      return next(createError(404,
        'No ComfyTag account found for that contact'))
    }
    if (recipient._id.toString() === senderId) {
      return next(createError(400,
        'Cannot transfer a ticket to yourself'))
    }

    // Generate secure transfer token
    const transferToken = crypto.randomBytes(32).toString('hex')

    await Audience.findByIdAndUpdate(ticketId, {
      transferredTo: recipient._id.toString(),
      transferToken,
      status: 'active', // still active until accepted
    })

    res.status(200).json({
      message: 'Transfer initiated',
      recipientName: recipient.name,
      ticketId,
    })
  } catch (err) {
    next(err)
  }
}

// POST /tickets/transfer/accept
// Recipient accepts the transfer
export const acceptTransfer = async (req, res, next) => {
  try {
    const { ticketId, transferToken } = req.body
    const recipientId = req.user.id

    const ticket = await Audience.findById(ticketId)
      .select('+transferToken')
    if (!ticket) return next(createError(404, 'Ticket not found'))

    if (ticket.transferredTo.toString() !== recipientId) {
      return next(createError(403,
        'This transfer is not addressed to you'))
    }
    if (ticket.transferToken !== transferToken) {
      return next(createError(400, 'Invalid transfer token'))
    }

    const previousOwner = ticket.user_id

    // Transfer ownership
    await Audience.findByIdAndUpdate(ticketId, {
      user_id: recipientId,
      faceOwner: recipientId,
      transferredFrom: previousOwner,
      transferredAt: new Date(),
      transferToken: null,
      status: 'active',
      // Reset check-in for new owner
      checkedIn: false,
      checkedInAt: null,
      checkedInMethod: null,
      // Reset face link — recipient must enroll face
      faceLinkedAt: null,
    })

    res.status(200).json({
      message: 'Ticket transfer accepted',
      ticketId,
    })
  } catch (err) {
    next(err)
  }
}

// POST /tickets/transfer/decline
// Recipient declines the transfer
export const declineTransfer = async (req, res, next) => {
  try {
    const { ticketId } = req.body
    const recipientId = req.user.id

    const ticket = await Audience.findById(ticketId)
    if (!ticket) return next(createError(404, 'Ticket not found'))
    if (ticket.transferredTo.toString() !== recipientId) {
      return next(createError(403,
        'This transfer is not addressed to you'))
    }

    // Cancel the transfer — ticket stays with original owner
    await Audience.findByIdAndUpdate(ticketId, {
      transferredTo: null,
      transferToken: null,
    })

    res.status(200).json({
      message: 'Transfer declined',
      ticketId
    })
  } catch (err) {
    next(err)
  }
}

// POST /tickets/transfer/claim
// Any authenticated user claims a ticket by its reference (open share link)
export const claimTicket = async (req, res, next) => {
  try {
    const { reference } = req.body
    if (!reference) return next(createError(400, 'reference is required'))

    const ticket = await Audience.findOne({ reference })
    if (!ticket) return next(createError(404, 'Ticket not found'))
    if (ticket.status !== 'active') {
      return next(createError(410, 'Ticket is no longer available'))
    }
    if (ticket.user_id.toString() === req.user.id) {
      return next(createError(400, 'You already own this ticket'))
    }
    if (ticket.transferToken) {
      return next(createError(409, 'Ticket has a pending transfer'))
    }

    const previousOwner = ticket.user_id
    await Audience.findByIdAndUpdate(ticket._id, {
      user_id: req.user.id,
      faceOwner: req.user.id,
      transferredFrom: previousOwner,
      transferredTo: null,
      transferredAt: new Date(),
      transferToken: null,
      checkedIn: false,
      checkedInAt: null,
      checkedInMethod: null,
      faceLinkedAt: null,
    })

    res.status(200).json({ message: 'Ticket claimed', ticketId: ticket._id })
  } catch (err) {
    next(err)
  }
}

// GET /tickets/incoming-transfers
// Get all pending incoming transfers for the logged-in user
export const getIncomingTransfers = async (req, res, next) => {
  try {
    const userId = req.user.id

    const pendingTransfers = await Audience.find({
      transferredTo: userId,
      status: 'active',
      transferToken: { $ne: null },
    }).select('+transferToken').lean()

    // Remove sensitive transferToken from response before sending to client
    const transfers = pendingTransfers.map(t => {
      const { transferToken, ...rest } = t
      return rest
    })

    res.status(200).json({
      count: transfers.length,
      transfers,
    })
  } catch (err) {
    next(err)
  }
}
