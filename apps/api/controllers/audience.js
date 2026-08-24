
import Event from '../models/Event.js'
import Audience from '../models/Audience.js';
import User from '../models/User.js';
import { createError } from '../utils/error.js'
import { enqueueEmail } from '../jobs/emailQueue.js';
import { createNotification } from './notification.js'
import moment from 'moment/moment.js';
import { QR } from '../utils/QRCode.js';
import { generateSecret } from 'otplib'
import { verifyAndCheckPaystackReference } from '../utils/paystack.js'
import { calculateTicketCharge } from '../utils/ticketFees.js'
import { createPaidTicket, TicketCreationError } from '../services/ticketCreation.js'

// Returns true only if the event exists and its planner_id matches partnerId.
const assertPartnerOwnsEvent = async (eventId, partnerId) => {
    const event = await Event.findOne({ _id: eventId, planner_id: partnerId }).select('_id').lean()
    return event !== null
}



// CREATE FREE TICKET (no payment / no auth required)
export const createFreeAudience = async (req, res, next) => {
    const { name, email, phone, eventname, numOfTicket, type, userId } = req.body
    const eventId = req.params.eventId

    try {
        // Check free ticket limit (max 10 per email per event)
        const ticketCount = await Audience.countDocuments({ event_id: eventId, email })
        if (ticketCount >= 10) {
            return res.status(400).json({ success: false, message: 'You have reached the maximum limit of 10 free tickets per person for this event.' })
        }

        // Check tier capacity
        const event = await Event.findById(eventId)
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' })
        }
        const tier = event.ticketType.find(t => t.name === type)
        if (tier && tier.capacity > 0 && tier.sold >= tier.capacity) {
            return res.status(400).json({ success: false, message: 'This ticket tier is sold out.' })
        }

        const existingCount = await Audience.countDocuments({ event_id: eventId })

        const newAudience = new Audience({
            name,
            email,
            phone,
            eventname,
            numOfTicket: numOfTicket || 1,
            type,
            amount: 0,
            reference: `FREE_${Date.now()}`,
            status: 'active',
            event_id: eventId,
            user_id: userId || 'guest',
            totpSecret: generateSecret(),
            ticketNumber: existingCount + 1,
        })

        const savedAudience = await newAudience.save()

        // Generate and save QR code
        let qrCode = ''
        try {
            qrCode = await QR(savedAudience.reference)
            await Audience.findByIdAndUpdate(savedAudience._id, { qrCode })
            savedAudience.qrCode = qrCode
        } catch (qrErr) {
            console.log('QR generation failed:', qrErr.message)
        }

        try {
            await Event.updateOne(
                { _id: eventId, "ticketType.name": type },
                {
                    $inc: {
                        "ticketType.$.sold": savedAudience.numOfTicket,
                        sold: savedAudience.numOfTicket,
                    }
                }
            )
        } catch (err) {
            next(err)
        }

        res.status(200).json(savedAudience)

        const baseUrl = process.env.BASE_URL || 'https://comfytag.com'
        await enqueueEmail({
          to: savedAudience.email,
          subject: `ComfyTag Ticket — ${savedAudience.eventname}`,
          template: 'ticketConfirmation.hbs',
          data: {
            eventName: savedAudience.eventname,
            eventDate: event?.date ? moment(event.date).format('ddd, MMM D, YYYY') : 'TBA',
            eventTime: event?.startTime || 'TBA',
            attendeeName: savedAudience.name?.split(' ')[0] || '',
            ticketTier: savedAudience.type,
            qty: savedAudience.numOfTicket,
            ticketLabel: savedAudience.numOfTicket > 1 ? 'tickets' : 'ticket',
            totalPrice: 'Free',
            organizerName: event?.planner || '',
            eventVenue: event?.venue || event?.address || '',
            eventDescription: event?.description ? event.description.slice(0, 150) + (event.description.length > 150 ? '…' : '') : '',
            shareLink: `${baseUrl}/share?ticket=${savedAudience.reference}`,
            qrCodeUrl: qrCode || null,
            year: new Date().getFullYear(),
            unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
            preferencesUrl: `${baseUrl}/preferences`,
          },
          from: 'tickets@comfytag.com',
        }).catch(err => console.error('[FreeTicket] Email queue failed:', err.message))

        // Notify organizer that a free ticket was claimed
        if (event?.planner_id) {
            const io = req.app.locals.io
            const qty = savedAudience.numOfTicket || 1
            await createNotification({
                userId: event.planner_id,
                type: 'ticket_sold',
                title: 'Free ticket claimed',
                message: `${qty} free ticket${qty > 1 ? 's' : ''} claimed for ${savedAudience.eventname}`,
                data: {
                    eventId: eventId,
                    eventName: savedAudience.eventname,
                    ticketId: savedAudience._id.toString(),
                    qty: String(qty),
                    revenue: '0',
                },
                io,
            }).catch(err => console.error('[Notification] Organizer ticket_sold failed:', err.message))
        }
    } catch (err) {
        next(err)
    }
}

// CREATE
export const createAudience = async (req, res, next) => {
    const eventId = req.params.eventId;
    const userId = req.params.userId;

    try {
        const event = await Event.findById(eventId)
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' })
        }

        const tierName = req.body.type
        const tier = event.ticketType.find(t => t.name === tierName)
        if (!tier) {
            return res.status(400).json({ success: false, message: 'Invalid ticket tier.' })
        }

        const numOfTicket = Math.max(1, parseInt(req.body.numOfTicket, 10) || 1)

        // Server-side derivation — never trust req.body.amount or req.body.isFreeTicket
        const isFreeTicket = tier.price === 0
        const subtotal = tier.price * numOfTicket

        // Free-ticket duplicate limit
        if (isFreeTicket) {
            const freeTicketCount = await Audience.countDocuments({ event_id: eventId, user_id: userId, amount: 0 })
            if (freeTicketCount >= 10) {
                return res.status(400).json({ success: false, message: 'You have reached the maximum limit of 10 free tickets per person for this event.' })
            }
        }

        let serverAmount = 0
        let organizerNet = 0
        if (!isFreeTicket) {
            if (!req.body.reference) {
                return res.status(400).json({ success: false, message: 'Paid tickets require a Paystack reference.' })
            }

            // Re-verify server-side rather than trusting that the client already
            // called /paystack/verify/:reference — a client could otherwise submit
            // an arbitrary/unpaid reference straight to this endpoint.
            const { ok, reason, data } = await verifyAndCheckPaystackReference(req.body.reference)
            if (!ok) {
                return res.status(402).json({ success: false, message: reason || 'Payment could not be verified.' })
            }

            const charge = calculateTicketCharge(tier.price, numOfTicket)
            if (data.amount !== charge.totalCharge * 100) {
                return res.status(402).json({ success: false, message: 'Charged amount does not match the expected ticket price.' })
            }
            serverAmount = charge.totalCharge
            organizerNet = charge.organizerNet
        }

        const io = req.app.locals.io
        let savedAudience
        try {
            savedAudience = await createPaidTicket({
                event,
                eventId,
                tierName,
                numOfTicket,
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                userId,
                reference: req.body.reference,
                serverAmount,
                organizerNet,
                isFreeTicket,
                io,
            })
        } catch (err) {
            if (err instanceof TicketCreationError) {
                return res.status(err.status).json({ success: false, message: err.message })
            }
            throw err
        }

        res.status(200).json(savedAudience)
    } catch (err) {
        next(err)
    }
}

// UPDATE
export const updateAudience = async (req, res, next) => {
    try {
        const ticket = await Audience.findById(req.params.id)
        if (!ticket) return next(createError(404, 'Ticket not found'))

        if (!req.user.isAdmin) {
            const requesterId = (req.user._id ?? req.user.id ?? '').toString()
            const ownsEvent = await assertPartnerOwnsEvent(ticket.event_id, requesterId)
            if (!ownsEvent) return next(createError(403, 'Not authorized to update this ticket'))
        }

        // Strict whitelist — partners may only correct attendee contact details
        const updateData = {}
        if ('name' in req.body) updateData.name = req.body.name
        if ('phone' in req.body) updateData.phone = req.body.phone
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update. Allowed: name, phone.' })
        }

        const updatedAudience = await Audience.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        )
        res.status(200).json(updatedAudience)
    } catch (err) {
        next(err)
    }
}

// DELETE
export const deleteAudience = async (req, res, next) => {
    const ticketId = req.params.id
    const urlUserId = req.params.userId
    try {
        const ticket = await Audience.findById(ticketId)
        if (!ticket) return next(createError(404, 'Ticket not found'))

        const requesterId = (req.user._id ?? req.user.id ?? '').toString()

        if (!req.user.isAdmin) {
            const isSelf = ticket.user_id === requesterId
            const ownsEvent = !isSelf && await assertPartnerOwnsEvent(ticket.event_id, requesterId)
            if (!isSelf && !ownsEvent) {
                return next(createError(403, 'Not authorized to delete this ticket'))
            }
        }

        await Audience.findByIdAndDelete(ticketId)
        try {
            await User.findByIdAndUpdate(urlUserId, {
                $pull: { events: ticketId },
            })
        } catch (err) {
            next(err)
        }
        res.status(200).json('Audience has been deleted')
    } catch (err) {
        next(err)
    }
}

// GET BY REFERENCE (public — used for claim-ticket preview)
export const getAudienceByReference = async (req, res, next) => {
    try {
        const ticket = await Audience.findOne({ reference: req.params.reference })
            .select('eventname type date event_id status user_id')
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
        res.status(200).json(ticket)
    } catch (err) {
        next(err)
    }
}

// GET — self or admin (enforced in controller)
export const getAudience = async (req, res, next) => {
    try {
        const ticket = await Audience.findById(req.params.id).lean()
        if (!ticket) return next(createError(404, 'Ticket not found'))
        const requesterId = (req.user._id ?? req.user.id ?? '').toString()
        if (!req.user.isAdmin && ticket.user_id !== requesterId) {
            return next(createError(403, 'Not authorized'))
        }

        const event = await Event.findById(ticket.event_id).lean()

        res.status(200).json({
            ...ticket,
            eventDate: event?.date || ticket.date,
            eventTime: event?.startTime,
            eventEndTime: event?.endTime,
            eventVenue: event?.venue,
            eventLocation: event?.location,
            eventState: event?.state,
            eventSlug: event?.slug,
            eventImage: event?.images?.[0] || null,
        })
    } catch (err) {
        next(err)
    }
}

// GET ALL — admin only, paginated
export const getAllAudience = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) {
            return next(createError(403, 'Forbidden'))
        }

        const { page = 1, limit = 50 } = req.query
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50))
        const skip = (pageNum - 1) * limitNum

        const [audience, total] = await Promise.all([
            Audience.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Audience.countDocuments(),
        ])

        res.status(200).json({
            data: audience,
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        })
    } catch (err) {
        next(err)
    }
}

// GET ALL
export const getUserAudience = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const userEmail = req.user?.email

        const query = userEmail
            ? { $or: [{ user_id: userId }, { email: userEmail }] }
            : { user_id: userId }

        const getUserAudienceAll = await Audience.find(query)
        res.status(200).json(getUserAudienceAll)

        // Silently migrate guest tickets to the real user_id for future queries (fire-and-forget)
        if (userEmail && userId !== 'guest') {
            Audience.updateMany(
                { email: userEmail, user_id: 'guest' },
                { $set: { user_id: userId } }
            ).catch(err => console.error('[Audience] Guest ticket migration failed:', err.message))
        }
    } catch (err) {
        next(err)
    }
}

// GET /tickets/my - user's purchased tickets with event enrichment
export const getMyTickets = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id
        const userEmail = req.user?.email

        // Query by user_id OR email (support guest ticket migration)
        const query = userEmail
            ? { $or: [{ user_id: userId }, { email: userEmail }] }
            : { user_id: userId }

        // Fetch user's tickets
        const tickets = await Audience.find(query).lean()

        if (!tickets || tickets.length === 0) {
            return res.status(200).json({ success: true, data: [] })
        }

        // Batch-fetch event details to avoid N+1 queries
        const eventIds = [...new Set(tickets.map(t => t.event_id))]
        const events = await Event.find({ _id: { $in: eventIds } }).lean()
        const eventMap = Object.fromEntries(events.map(e => [e._id.toString(), e]))

        // Enrich tickets with event metadata
        const enriched = tickets.map(t => ({
            ...t,
            eventDate: eventMap[t.event_id?.toString?.()]?.date || t.date,
            eventTime: eventMap[t.event_id?.toString?.()]?.startTime,
            eventEndTime: eventMap[t.event_id?.toString?.()]?.endTime,
            eventVenue: eventMap[t.event_id?.toString?.()]?.venue,
            eventLocation: eventMap[t.event_id?.toString?.()]?.location,
            eventState: eventMap[t.event_id?.toString?.()]?.state,
            eventSlug: eventMap[t.event_id?.toString?.()]?.slug,
            eventImage: eventMap[t.event_id?.toString?.()]?.images?.[0] || null,
        }))

        res.status(200).json({ success: true, data: enriched })
    } catch (err) {
        next(err)
    }
}

// GET ALL with pagination
export const getEventAudience = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) {
            const requesterId = (req.user._id ?? req.user.id ?? '').toString()
            const ownsEvent = await assertPartnerOwnsEvent(req.params.eventId, requesterId)
            if (!ownsEvent) return next(createError(403, 'Not authorized to view attendees for this event'))
        }

        const { page = 1, limit = 25 } = req.query
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 25)
        const skip = (pageNum - 1) * limitNum

        const [audience, total] = await Promise.all([
            Audience.find({ event_id: req.params.eventId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Audience.countDocuments({ event_id: req.params.eventId }),
        ])

        res.status(200).json({
            data: audience,
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        })
    } catch (err) {
        next(err)
    }
}


// POST /audience/:id/checkin
// Manual check-in toggle by organizer
export const manualCheckIn = async (req, res, next) => {
    try {
        const { id: ticketId } = req.params
        const { checkedIn = true } = req.body

        const ticket = await Audience.findById(ticketId)
        if (!ticket) return next(createError(404, 'Ticket not found'))

        if (!req.user.isAdmin) {
            const requesterId = (req.user._id ?? req.user.id ?? '').toString()
            const ownsEvent = await assertPartnerOwnsEvent(ticket.event_id, requesterId)
            if (!ownsEvent) return next(createError(403, 'Not authorized to check in tickets for this event'))
        }

        // Update check-in status
        ticket.checkedIn = checkedIn
        if (checkedIn) {
            ticket.checkedInAt = new Date()
            ticket.checkedInMethod = 'manual'
        } else {
            ticket.checkedInAt = null
            ticket.checkedInMethod = null
        }

        const updated = await ticket.save()
        res.status(200).json({
            message: checkedIn ? 'Ticket checked in' : 'Check-in reversed',
            ticket: updated,
        })
    } catch (err) {
        next(err)
    }
}

// GET /events/:eventId/audience/export
// CSV export of all attendees for an event
export const exportEventAudienceCSV = async (req, res, next) => {
    try {
        const { eventId } = req.params

        if (!req.user.isAdmin) {
            const requesterId = (req.user._id ?? req.user.id ?? '').toString()
            const ownsEvent = await assertPartnerOwnsEvent(eventId, requesterId)
            if (!ownsEvent) return next(createError(403, 'Not authorized to export attendees for this event'))
        }

        const tickets = await Audience.find({ event_id: eventId }).sort({ createdAt: -1 })

        if (tickets.length === 0) {
            return res.status(200)
                .setHeader('Content-Type', 'text/csv')
                .setHeader('Content-Disposition', 'attachment; filename=attendees.csv')
                .send('No attendees found')
        }

        // Build CSV header
        const headers = ['Name', 'Email', 'Phone', 'Tickets', 'Amount (₦)', 'Type', 'Purchase Date', 'Status', 'Checked In', 'Check-In Date', 'Check-In Method']
        const rows = tickets.map(t => [
            `"${t.name}"`,
            `"${t.email}"`,
            `"${t.phone || ''}"`,
            t.numOfTicket,
            t.amount,
            `"${t.type}"`,
            moment(t.createdAt).format('YYYY-MM-DD HH:mm'),
            t.status,
            t.checkedIn ? 'Yes' : 'No',
            t.checkedInAt ? moment(t.checkedInAt).format('YYYY-MM-DD HH:mm') : '',
            t.checkedInMethod || '',
        ])

        const csv = [
            headers.join(','),
            ...rows.map(r => r.join(',')),
        ].join('\n')

        res.status(200)
            .setHeader('Content-Type', 'text/csv; charset=utf-8')
            .setHeader('Content-Disposition', 'attachment; filename=attendees.csv')
            .send(csv)
    } catch (err) {
        next(err)
    }
}

// POST /audience/checkin-by-ref
// QR / barcode scanner check-in: accepts a ticket reference string
export const checkInByReference = async (req, res, next) => {
    try {
        const { reference } = req.body
        if (!reference) return res.status(400).json({ success: false, message: 'Reference is required' })

        const ticket = await Audience.findOne({ reference: reference.trim().toUpperCase() })
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' })

        if (!req.user.isAdmin) {
            const requesterId = (req.user._id ?? req.user.id ?? '').toString()
            const ownsEvent = await assertPartnerOwnsEvent(ticket.event_id, requesterId)
            if (!ownsEvent) return next(createError(403, 'Not authorized to check in tickets for this event'))
        }

        if (ticket.status === 'refunded') return res.status(400).json({ success: false, message: 'Ticket has been refunded' })
        if (ticket.status === 'transferred') return res.status(400).json({ success: false, message: 'Ticket has been transferred' })

        if (ticket.checkedIn) {
            return res.status(200).json({
                success: false,
                alreadyCheckedIn: true,
                attendeeName: ticket.name,
                checkedInAt: ticket.checkedInAt,
                ticketType: ticket.type,
            })
        }

        ticket.checkedIn = true
        ticket.checkedInAt = new Date()
        ticket.checkedInMethod = 'qr'
        ticket.status = 'used'
        await ticket.save()

        res.status(200).json({
            success: true,
            attendeeName: ticket.name,
            email: ticket.email,
            ticketType: ticket.type,
            numOfTicket: ticket.numOfTicket,
            checkedInAt: ticket.checkedInAt,
        })
    } catch (err) {
        next(err)
    }
}

// const  details = `<div>
//     Name : ${savedAudience.name} \n
//     Event : ${savedAudience.eventname} \n
//     Number of tickets : ${savedAudience.numOfTicket} \n
//     Ticket type : ${savedAudience.type} \n
//     Amount paid :  ${savedAudience.amount} \n
//     Date : ${moment(savedAudience.createdAt).format("YYYY-MM-DD")} \n
//     </div>`




