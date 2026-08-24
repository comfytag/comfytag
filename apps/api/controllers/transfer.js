import Audience from '../models/Audience.js'
import User from '../models/User.js'
import Event from '../models/Event.js'
import { createError } from '../utils/error.js'
import { enqueueEmail } from '../jobs/emailQueue.js'
import { createNotification } from './notification.js'
import { QR } from '../utils/QRCode.js'
import moment from 'moment/moment.js'
import crypto from 'crypto'

// POST /tickets/transfer/initiate
// Ticket owner initiates a transfer to another user.
// If shareQuantity < numOfTicket, a child "escrow" document is created for
// exactly shareQuantity tickets; the parent document is decremented only after
// the child persists successfully (safe ordering for transactional integrity).
export const initiateTransfer = async (req, res, next) => {
  try {
    const { ticketId, recipientEmail, recipientPhone, shareQuantity } = req.body
    const senderId = req.user.id

    if (!ticketId || (!recipientEmail && !recipientPhone)) {
      return next(createError(400, 'ticketId and recipient contact required'))
    }

    // Verify ticket belongs to sender and is transferable
    const ticket = await Audience.findById(ticketId)
    if (!ticket) return next(createError(404, 'Ticket not found'))
    if (ticket.user_id.toString() !== senderId) {
      return next(createError(403, 'You do not own this ticket'))
    }
    if (ticket.status !== 'active') {
      return next(createError(400, `Cannot transfer a ${ticket.status} ticket`))
    }
    if (ticket.numOfTicket < 1) {
      return next(createError(400, 'This ticket has no remaining seats to transfer'))
    }

    // Find recipient
    const recipientQuery = recipientEmail ? { email: recipientEmail } : { phone: recipientPhone }
    const recipient = await User.findOne(recipientQuery)
    if (!recipient) {
      return next(createError(404, 'No ComfyTag account found for that contact'))
    }
    if (recipient._id.toString() === senderId) {
      return next(createError(400, 'Cannot transfer a ticket to yourself'))
    }

    // Validate shareQuantity
    const qty = shareQuantity != null ? Number(shareQuantity) : ticket.numOfTicket
    if (!Number.isInteger(qty) || qty < 1) {
      return next(createError(400, 'shareQuantity must be a positive integer'))
    }
    if (qty > ticket.numOfTicket) {
      return next(createError(400,
        `shareQuantity (${qty}) exceeds available tickets (${ticket.numOfTicket})`))
    }

    const transferToken = crypto.randomBytes(32).toString('hex')
    const isPartial = qty < ticket.numOfTicket
    let targetTicketId

    if (isPartial) {
      // ── Partial split: create child document first, then decrement parent ──
      // Child is saved before the parent is modified so that a child-save
      // failure leaves the parent completely untouched.
      const childDoc = new Audience({
        name:         ticket.name,
        event_id:     ticket.event_id,
        user_id:      senderId,       // sender holds the escrow ticket until accepted
        eventname:    ticket.eventname,
        amount:       Math.round(ticket.amount * qty / ticket.numOfTicket),
        organizerNet: ticket.organizerNet != null
          ? Math.round(ticket.organizerNet * qty / ticket.numOfTicket)
          : null,
        isFreeTicket: ticket.isFreeTicket,
        numOfTicket:  qty,
        reference:    `${ticket.reference}_SPLIT_${Date.now()}`,
        type:         ticket.type,
        phone:        ticket.phone,
        email:        ticket.email,
        status:       'escrow',
        parentTicketId: ticket._id,
        transferredTo:  recipient._id.toString(),
        transferToken,
      })

      const savedChild = await childDoc.save()

      // Generate QR for child — failure is non-fatal; child is already persisted
      try {
        const childQr = await QR(savedChild.reference)
        await Audience.findByIdAndUpdate(savedChild._id, { qrCode: childQr })
      } catch (qrErr) {
        console.error('[Transfer Split] QR generation failed:', qrErr.message)
      }

      // Atomically decrement parent only after child is safely on disk.
      // The $gte guard prevents a race condition if two partial transfers
      // are initiated concurrently against the same parent.
      const updatedParent = await Audience.findOneAndUpdate(
        { _id: ticketId, numOfTicket: { $gte: qty } },
        { $inc: { numOfTicket: -qty } },
        { new: true }
      )

      if (!updatedParent) {
        // Race condition: tickets claimed by another concurrent operation.
        // Cancel the child and surface the conflict to the caller.
        await Audience.findByIdAndUpdate(savedChild._id, {
          status: 'cancelled',
          transferredTo: null,
          transferToken: null,
        })
        return next(createError(409,
          'Not enough tickets available — please try again'))
      }

      targetTicketId = savedChild._id
    } else {
      // ── Full transfer: legacy path — mark parent with the transfer token ──
      await Audience.findByIdAndUpdate(ticketId, {
        transferredTo: recipient._id.toString(),
        transferToken,
        status: 'active',
      })
      targetTicketId = ticketId
    }

    res.status(200).json({
      message: isPartial ? 'Partial transfer initiated' : 'Transfer initiated',
      recipientName: recipient.name,
      ticketId: targetTicketId,
      isPartial,
      shareQuantity: qty,
    })

    // ── Post-response side effects (non-blocking) ──────────────────────────
    const io = req.app.locals.io
    const [sender, event] = await Promise.all([
      User.findById(senderId),
      Event.findById(ticket.event_id),
    ])
    const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

    await createNotification({
      userId: recipient._id.toString(),
      type: 'transfer_received',
      title: 'You received a ticket',
      message: `${sender?.name || 'Someone'} sent you ${qty > 1 ? `${qty} tickets` : 'a ticket'}`,
      data: {
        ticketId: targetTicketId,
        senderName: sender?.name,
        senderId,
        shareQuantity: qty,
        isPartial,
        // Only in-app channel that carries this besides the email deep link
        // (acceptLink/declineLink below) — the recipient needs it to call
        // POST /tickets/transfer/accept|decline, and GET /tickets/transfer/incoming
        // deliberately strips it from its response, so without this the app
        // has no way to complete a transfer without leaving the app for email.
        transferToken,
      },
      io,
    }).catch(err => console.error('[Notification] Transfer received failed:', err.message))

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
        qty,
        ticketLabel: qty > 1 ? 'tickets' : 'ticket',
        expiryDate: moment().add(7, 'days').format('ddd, MMM D, YYYY'),
        acceptLink:  `${baseUrl}/tickets/transfer/${targetTicketId}/accept?token=${transferToken}`,
        declineLink: `${baseUrl}/tickets/transfer/${targetTicketId}/decline?token=${transferToken}`,
        year: new Date().getFullYear(),
        unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
        preferencesUrl: `${baseUrl}/preferences`,
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
    const recipientUser = await User.findById(recipientId)

    // Transfer ownership.
    // Works for both full-transfer (status: 'active') and partial-split
    // escrow tickets (status: 'escrow') — status: 'active' covers both.
    //
    // email is updated here too — getMyTickets falls back to matching by
    // email (for guests who bought before creating an account), so leaving
    // the previous owner's email on this document would keep it showing up
    // in *their* ticket list forever after a transfer, even though user_id
    // now points to the recipient.
    await Audience.findByIdAndUpdate(ticketId, {
      user_id: recipientId,
      faceOwner: recipientId,
      email: recipientUser?.email ?? ticket.email,
      transferredFrom: previousOwner,
      transferredAt: new Date(),
      transferToken: null,
      transferredTo: null,
      status: 'active',
      checkedIn: false,
      checkedInAt: null,
      checkedInMethod: null,
      faceLinkedAt: null,
    })

    res.status(200).json({
      message: 'Ticket transfer accepted',
      ticketId,
    })

    // Create in-app notification for original owner
    const io = req.app.locals.io

    await createNotification({
      userId: previousOwner.toString(),
      type: 'transfer_accepted',
      title: 'Transfer accepted ✓',
      message: `${recipientUser?.name || 'Someone'} accepted your ticket`,
      data: {
        ticketId,
        recipientName: recipientUser?.name,
        recipientId: recipientId,
      },
      io,
    }).catch(err => console.error('[Notification] Transfer accepted failed:', err.message))

    // Enqueue transfer accepted email to original owner (non-blocking)
    const sender = await User.findById(previousOwner)
    const event = await Event.findById(ticket.event_id)
    const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

    enqueueEmail({
      to: sender?.email,
      subject: `Transfer accepted ✓ ${event?.title || 'ticket'}`,
      template: 'transferAccepted.hbs',
      data: {
        senderName: sender?.name || 'You',
        recipientName: recipientUser?.name || 'Someone',
        eventName: event?.title || ticket.eventname || 'Event',
        eventDate: event?.startDate ? moment(event.startDate).format('ddd, MMM D, YYYY') : 'TBA',
        eventTime: event?.startTime || 'TBA',
        ticketTier: ticket.type,
        dashboardLink: `${baseUrl}/tickets`,
        year: new Date().getFullYear(),
        unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
        preferencesUrl: `${baseUrl}/preferences`,
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

    const isEscrowChild = ticket.status === 'escrow' && ticket.parentTicketId != null

    if (isEscrowChild) {
      // ── Partial-split rollback ─────────────────────────────────────────
      // Restore parent quantity first so tickets are never stranded if the
      // subsequent child-cancel write fails.
      const parentUpdated = await Audience.findOneAndUpdate(
        { _id: ticket.parentTicketId },
        { $inc: { numOfTicket: ticket.numOfTicket } },
        { new: true }
      )
      if (!parentUpdated) {
        console.error('[Transfer Rollback] Parent ticket not found:', ticket.parentTicketId)
      }
      await Audience.findByIdAndUpdate(ticketId, {
        status: 'cancelled',
        transferredTo: null,
        transferToken: null,
      })
    } else {
      // ── Full-transfer cancel: ticket stays with original owner ─────────
      await Audience.findByIdAndUpdate(ticketId, {
        transferredTo: null,
        transferToken: null,
      })
    }

    // For email deep links, point back to the parent when rolling back a split
    const emailTicketId = isEscrowChild ? ticket.parentTicketId : ticketId

    res.status(200).json({ message: 'Transfer declined', ticketId })

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
        transferLink: `${baseUrl}/tickets/${emailTicketId}/transfer`,
        sellLink: `${baseUrl}/tickets/${emailTicketId}/sell`,
        year: new Date().getFullYear(),
        unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
        preferencesUrl: `${baseUrl}/preferences`,
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
    // email is updated here too — otherwise getMyTickets' guest-migration
    // email fallback (see audience.js:getMyTickets) keeps matching this
    // ticket for the previous owner even after user_id has moved on.
    await Audience.findByIdAndUpdate(ticket._id, {
      user_id: req.user.id,
      faceOwner: req.user.id,
      email: req.user.email ?? ticket.email,
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
      status: { $in: ['active', 'escrow'] },
      transferToken: { $ne: null },
    }).select('+transferToken').lean()

    // Batch-fetch event details to avoid N+1 queries
    const eventIds = [...new Set(pendingTransfers.map(t => t.event_id))]
    const events = await Event.find({ _id: { $in: eventIds } }).lean()
    const eventMap = Object.fromEntries(events.map(e => [e._id.toString(), e]))

    // Remove sensitive transferToken from response before sending to client,
    // and enrich with event metadata (mirrors getMyTickets/getAudience) so
    // the review screen can show a real image/venue/date, not just the bare
    // ticket fields.
    const transfers = pendingTransfers.map(t => {
      const { transferToken, ...rest } = t
      const event = eventMap[t.event_id?.toString?.()]
      return {
        ...rest,
        eventDate: event?.date || t.date,
        eventTime: event?.startTime,
        eventEndTime: event?.endTime,
        eventVenue: event?.venue,
        eventLocation: event?.location,
        eventState: event?.state,
        eventSlug: event?.slug,
        eventImage: event?.images?.[0] || null,
      }
    })

    res.status(200).json({
      count: transfers.length,
      transfers,
    })
  } catch (err) {
    next(err)
  }
}
