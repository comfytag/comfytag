
import Event from '../models/Event.js'
import Audience from '../models/Audience.js';
import User from '../models/User.js';
import { createError } from '../utils/error.js'
import { enqueueEmail } from '../jobs/emailQueue.js';
import { createNotification } from './notification.js'
import moment from 'moment/moment.js';
import { QR } from '../utils/QRCode.js';
import { generateSecret } from 'otplib'

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
        // 5% platform fee applied to the ticket subtotal
        const serverAmount = isFreeTicket
            ? 0
            : Math.round(tier.price * numOfTicket * 1.05)

        // Free-ticket duplicate limit
        if (isFreeTicket) {
            const freeTicketCount = await Audience.countDocuments({ event_id: eventId, user_id: userId, amount: 0 })
            if (freeTicketCount >= 10) {
                return res.status(400).json({ success: false, message: 'You have reached the maximum limit of 10 free tickets per person for this event.' })
            }
        }
        if (!isFreeTicket && !req.body.reference) {
            return res.status(400).json({ success: false, message: 'Paid tickets require a Paystack reference.' })
        }

        // Atomic capacity check + decrement (Fix P-3 — eliminates TOCTOU race condition).
        // $elemMatch scopes both the name match and the sold guard to the same array element,
        // so the positional $ operator is unambiguous.
        const capacityFilter = tier.capacity > 0
            ? { _id: eventId, ticketType: { $elemMatch: { name: tierName, sold: { $lte: tier.capacity - numOfTicket } } } }
            : { _id: eventId, 'ticketType.name': tierName }

        const atomicEvent = await Event.findOneAndUpdate(
            capacityFilter,
            { $inc: { 'ticketType.$.sold': numOfTicket, sold: numOfTicket } },
            { new: true }
        )

        if (tier.capacity > 0 && !atomicEvent) {
            return res.status(409).json({ success: false, message: 'Tickets sold out or insufficient capacity.' })
        }

        // Build document from explicit field list — never spread req.body
        const newAudience = new Audience({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            eventname: req.body.eventname,
            numOfTicket,
            type: tierName,
            amount: serverAmount,
            reference: req.body.reference,
            event_id: eventId,
            user_id: userId,
            totpSecret: generateSecret(),
            isFreeTicket,
            status: 'active',
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

        // NOTE: sold count was already incremented atomically above — no second updateOne needed

        res.status(200).json(savedAudience)

        const baseUrl = process.env.BASE_URL || 'https://comfytag.com'
        const buyer = await User.findById(userId)

        // Create in-app notification with real-time emission
        const io = req.app.locals.io
        await createNotification({
          userId,
          type: 'ticket_confirmed',
          title: 'Ticket confirmed ✓',
          message: `Your ticket to ${savedAudience.eventname} is ready`,
          data: {
            ticketId: savedAudience._id.toString(),
            eventId: eventId,
            eventName: savedAudience.eventname,
            reference: savedAudience.reference,
          },
          io,
        }).catch(err => console.error('[Notification] In-app creation failed:', err.message))

        // Enqueue ticket confirmation email (CRITICAL PATH — must succeed)
        const ticketEmailResult = await enqueueEmail({
          to: savedAudience.email,
          subject: `ComfyTag Ticket — ${savedAudience.eventname}`,
          template: 'ticketConfirmation.hbs',
          data: {
            eventName: savedAudience.eventname,
            eventDate: savedAudience.date ? moment(savedAudience.date).format('ddd, MMM D, YYYY') : 'TBA',
            eventTime: savedAudience.time || 'TBA',
            attendeeName: savedAudience.name?.split(' ')[0] || '',
            ticketTier: savedAudience.type,
            qty: savedAudience.numOfTicket,
            ticketLabel: savedAudience.numOfTicket > 1 ? 'tickets' : 'ticket',
            totalPrice: savedAudience.amount === 0 ? 'Free' : `₦${savedAudience.amount.toLocaleString()}`,
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
        });

        if (!ticketEmailResult.success) {
          console.error(`[Audience] ERROR: Ticket confirmation email queue failed for ${savedAudience.email}: ${ticketEmailResult.error}`);
        }

        // ─── FLOW 3A: EVENT REMINDER SERIES ────────────────────────────────────
        // Schedule 48h and 4h reminders based on event start time
        // Guard: event.date may be null — NaN propagates into BullMQ/Redis Lua and crashes the queue
        const rawHours = event.date ? (event.date - new Date()) / (1000 * 60 * 60) : NaN;
        const hoursUntilEvent = Number.isFinite(rawHours) ? rawHours : 0;
        const delay48h = Math.max(0, (hoursUntilEvent - 48) * 60 * 60 * 1000);
        const delay4h = Math.max(0, (hoursUntilEvent - 4) * 60 * 60 * 1000);

        // Email 1: 48 hours before event
        const reminder48hResult = await enqueueEmail({
          to: savedAudience.email,
          subject: `You're going to ${event.name} in 2 days`,
          template: 'eventReminder48h.hbs',
          data: {
            firstName: savedAudience.name?.split(' ')[0] || '',
            eventName: event.name,
            eventId: eventId,
            eventDate: moment(event.date).format('ddd, MMM D, YYYY'),
            eventTime: event.startTime || 'TBA',
            eventVenue: event.venue || 'TBA',
            viewTicketLink: `${baseUrl}/tickets/${savedAudience._id}`,
            year: new Date().getFullYear(),
            unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
            preferencesUrl: `${baseUrl}/preferences`,
          },
          delay: delay48h,
          from: 'tickets@comfytag.com',
          userId: userId,
          notificationType: 'event_reminder',
        });

        if (!reminder48hResult.success) {
          console.error(`[Audience] ERROR: 48h reminder queue failed for ${savedAudience.email}: ${reminder48hResult.error}`);
        }

        // Email 2: 4 hours before event
        const reminder4hResult = await enqueueEmail({
          to: savedAudience.email,
          subject: `${event.name} starts in 4 hours — here's what you need`,
          template: 'eventReminder4h.hbs',
          data: {
            firstName: savedAudience.name?.split(' ')[0] || '',
            eventName: event.name,
            eventId: eventId,
            eventTime: event.startTime || 'TBA',
            eventAddress: event.address || '',
            eventVenue: event.venue || 'TBA',
            ticketLink: `${baseUrl}/tickets/${savedAudience._id}`,
            year: new Date().getFullYear(),
            unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
            preferencesUrl: `${baseUrl}/preferences`,
          },
          delay: delay4h,
          from: 'tickets@comfytag.com',
          userId: userId,
          notificationType: 'event_reminder',
        });

        if (!reminder4hResult.success) {
          console.error(`[Audience] ERROR: 4h reminder queue failed for ${savedAudience.email}: ${reminder4hResult.error}`);
        }
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
        const ticket = await Audience.findById(req.params.id)
        if (!ticket) return next(createError(404, 'Ticket not found'))
        const requesterId = (req.user._id ?? req.user.id ?? '').toString()
        if (!req.user.isAdmin && ticket.user_id !== requesterId) {
            return next(createError(403, 'Not authorized'))
        }
        res.status(200).json(ticket)
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
            eventSlug: eventMap[t.event_id?.toString?.()]?.slug,
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




