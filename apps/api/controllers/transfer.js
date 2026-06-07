import Audience from '../models/Audience.js'
import User from '../models/User.js'
import Event from '../models/Event.js'
import { createError } from '../utils/error.js'
import { enqueueEmail } from '../jobs/emailQueue.js'
import { createNotification } from './notification.js'
import moment from 'moment/moment.js'
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

    // Create in-app notification for recipient
    const io = req.app.locals.io
    const sender = await User.findById(senderId)

    await createNotification({
      userId: recipient._id.toString(),
      type: 'transfer_received',
      title: 'You received a ticket',
      message: `${sender?.name || 'Someone'} sent you a ticket`,
      data: {
        ticketId,
        senderName: sender?.name,
        senderId: senderId,
      },
      io,
    }).catch(err => console.error('[Notification] Transfer received failed:', err.message))

    // Enqueue transfer initiated email to recipient (non-blocking)
    const event = await Event.findById(ticket.event_id)
    const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

    enqueueEmail({
      to: recipient.email,
      subject: `${sender?.name || 'Someone'} sent you a ${event?.title || 'ticket'} ticket`,
      template: 'transferInitiated.hbs',
      data: {
        recipientName: recipient.name,
        senderName: sender?.name || 'A friend',
        eventName: event?.title || ticket.eventname || 'Event',
        eventDate: event?.startDate ? moment(event.startDate).format('ddd, MMM D, YYYY') : 'TBA',
        eventTime: event?.startTime || 'TBA',
        ticketTier: ticket.type,
        expiryDate: moment().add(7, 'days').format('ddd, MMM D, YYYY'),
        acceptLink: `${baseUrl}/tickets/transfer/${ticketId}/accept?token=${transferToken}`,
        declineLink: `${baseUrl}/tickets/transfer/${ticketId}/decline?token=${transferToken}`,
        year: new Date().getFullYear(),
      },
      from: 'tickets@comfytag.com',
    }).catch(err => console.error('[Transfer Initiated] Queue failed:', err.message))
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

    // Create in-app notification for original owner
    const io = req.app.locals.io
    const recipient2 = await User.findById(recipientId)

    await createNotification({
      userId: previousOwner.toString(),
      type: 'transfer_accepted',
      title: 'Transfer accepted ✓',
      message: `${recipient2?.name || 'Someone'} accepted your ticket`,
      data: {
        ticketId,
        recipientName: recipient2?.name,
        recipientId: recipientId,
      },
      io,
    }).catch(err => console.error('[Notification] Transfer accepted failed:', err.message))

    // Enqueue transfer accepted email to original owner (non-blocking)
    const sender = await User.findById(previousOwner)
    const recipient2 = await User.findById(recipientId)
    const event = await Event.findById(ticket.event_id)
    const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

    enqueueEmail({
      to: sender?.email,
      subject: `Transfer accepted ✓ ${event?.title || 'ticket'}`,
      template: 'transferAccepted.hbs',
      data: {
        senderName: sender?.name || 'You',
        recipientName: recipient2?.name || 'Someone',
        eventName: event?.title || ticket.eventname || 'Event',
        eventDate: event?.startDate ? moment(event.startDate).format('ddd, MMM D, YYYY') : 'TBA',
        eventTime: event?.startTime || 'TBA',
        ticketTier: ticket.type,
        dashboardLink: `${baseUrl}/tickets`,
        year: new Date().getFullYear(),
      },
      from: 'tickets@comfytag.com',
    }).catch(err => console.error('[Transfer Accepted] Queue failed:', err.message))
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

    // Create in-app notification for original owner
    const io = req.app.locals.io
    const recipient2 = await User.findById(recipientId)

    await createNotification({
      userId: ticket.user_id.toString(),
      type: 'transfer_declined',
      title: 'Transfer declined',
      message: `${recipient2?.name || 'Someone'} declined your ticket`,
      data: {
        ticketId,
        recipientName: recipient2?.name,
        recipientId: recipientId,
      },
      io,
    }).catch(err => console.error('[Notification] Transfer declined failed:', err.message))

    // Enqueue transfer declined email to original owner (non-blocking)
    const sender = await User.findById(ticket.user_id)
    const recipient2 = await User.findById(recipientId)
    const event = await Event.findById(ticket.event_id)
    const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

    enqueueEmail({
      to: sender?.email,
      subject: `${recipient2?.name || 'Someone'} couldn't accept your ticket`,
      template: 'transferDeclined.hbs',
      data: {
        senderName: sender?.name || 'You',
        recipientName: recipient2?.name || 'Someone',
        eventName: event?.title || ticket.eventname || 'Event',
        eventDate: event?.startDate ? moment(event.startDate).format('ddd, MMM D, YYYY') : 'TBA',
        eventTime: event?.startTime || 'TBA',
        ticketTier: ticket.type,
        transferLink: `${baseUrl}/tickets/${ticketId}/transfer`,
        sellLink: `${baseUrl}/tickets/${ticketId}/sell`,
        year: new Date().getFullYear(),
      },
      from: 'tickets@comfytag.com',
    }).catch(err => console.error('[Transfer Declined] Queue failed:', err.message))
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
