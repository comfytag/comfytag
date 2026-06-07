
import Event from '../models/Event.js'
import Audience from '../models/Audience.js';
import User from '../models/User.js';
import { createError } from '../utils/error.js'
import { sendTicket } from '../utils/sendEmail.js';
import { enqueueEmail } from '../jobs/emailQueue.js';
import { createNotification } from './notification.js'
import moment from 'moment/moment.js';
import { QR } from '../utils/QRCode.js';
import { generateSecret } from 'otplib'



// CREATE FREE TICKET (no payment / no auth required)
export const createFreeAudience = async (req, res, next) => {
    const { name, email, phone, eventname, numOfTicket, type, userId } = req.body
    const eventId = req.params.eventId

    try {
        // Check for duplicate ticket
        const existing = await Audience.findOne({ event_id: eventId, email })
        if (existing) {
            return res.status(400).json({ success: false, message: 'You already have a ticket for this event.' })
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
        } catch (qrErr) {
            console.log('QR generation failed:', qrErr.message)
        }

        try {
            await Event.findByIdAndUpdate(eventId, { $inc: { sold: savedAudience.numOfTicket } })
        } catch (err) {
            next(err)
        }

        res.status(200).json(savedAudience)

        const text = 'Your free ticket is confirmed'
        const details = `<div>
        <p>Your free ticket has been confirmed!</p>
        Name : ${savedAudience.name} <br/>
        Event : ${savedAudience.eventname} <br/>
        Number of tickets : ${savedAudience.numOfTicket} <br/>
        Ticket type : ${savedAudience.type} <br/>
        Amount paid : Free <br/>
        ${qrCode ? `<img src="${qrCode}" alt="Your QR Code" style="width:200px;height:200px;" />` : ''}</div>`
        await sendTicket(savedAudience.email, savedAudience.eventname + ' ticket', text, details)
    } catch (err) {
        next(err)
    }
}

// CREATE
export const createAudience = async (req, res, next) => {
    const eventId = req.params.eventId;
    const userId = req.params.userId;

    try {
        // Check for duplicate ticket
        const existing = await Audience.findOne({ event_id: eventId, user_id: userId })
        if (existing) {
            return res.status(400).json({ success: false, message: 'You already have a ticket for this event.' })
        }

        // Check tier capacity
        const event = await Event.findById(eventId)
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' })
        }
        const tier = event.ticketType.find(t => t.name === req.body.type)
        if (tier && tier.capacity > 0 && tier.sold >= tier.capacity) {
            return res.status(400).json({ success: false, message: 'This ticket tier is sold out.' })
        }

        const newAudience = new Audience({
            ...req.body,
            event_id: eventId,
            user_id: userId,
            totpSecret: generateSecret(),
        });

        const savedAudience = await newAudience.save()

        // Generate and save QR code
        let qrCode = ''
        try {
            qrCode = await QR(savedAudience.reference)
            await Audience.findByIdAndUpdate(savedAudience._id, { qrCode })
        } catch (qrErr) {
            console.log('QR generation failed:', qrErr.message)
        }

        try {
            const audienceCount = savedAudience.numOfTicket
            await Event.findByIdAndUpdate(eventId, {
                $inc: { sold: + audienceCount }
            });
        } catch (err) {
            next(err)
        }

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
            ticketId: savedAudience._id,
            eventId: eventId,
            eventName: savedAudience.eventname,
            reference: savedAudience.reference,
          },
          io,
        }).catch(err => console.error('[Notification] In-app creation failed:', err.message))

        // Enqueue ticket confirmation email (non-blocking)
        enqueueEmail({
          to: savedAudience.email,
          subject: `${savedAudience.eventname} — Your ticket is confirmed ✓`,
          template: 'ticketConfirmation.hbs',
          data: {
            eventName: savedAudience.eventname,
            eventDate: savedAudience.date ? moment(savedAudience.date).format('ddd, MMM D, YYYY') : 'TBA',
            eventTime: savedAudience.time || 'TBA',
            attendeeName: savedAudience.name,
            ticketTier: savedAudience.type,
            qty: savedAudience.numOfTicket,
            totalPrice: `₦${savedAudience.amount.toLocaleString()}`,
            faceEnrolled: buyer?.faceEnrolled || false,
            isPartner: buyer?.userType === 'organizer' || false,
            enrollFaceLink: `${baseUrl}/app/enroll-face`,
            createEventLink: `${baseUrl}/register-organizer`,
            shareLink: `${baseUrl}/share?ticket=${savedAudience.reference}`,
            qrCodeUrl: qrCode || null,
            year: new Date().getFullYear(),
          },
          from: 'tickets@comfytag.com',
        }).catch(err => console.error('[Ticket Confirmation] Queue failed:', err.message));

        // ─── FLOW 3A: EVENT REMINDER SERIES ────────────────────────────────────
        // Schedule 48h and 4h reminders based on event start time
        const hoursUntilEvent = (event.date - new Date()) / (1000 * 60 * 60);
        const delay48h = Math.max(0, (hoursUntilEvent - 48) * 60 * 60 * 1000);
        const delay4h = Math.max(0, (hoursUntilEvent - 4) * 60 * 60 * 1000);

        // Email 1: 48 hours before event
        enqueueEmail({
          to: savedAudience.email,
          subject: `You're going to ${event.name} in 2 days`,
          template: 'eventReminder48h.hbs',
          data: {
            firstName: savedAudience.name.split(' ')[0],
            eventName: event.name,
            eventId: eventId,
            eventDate: moment(event.date).format('ddd, MMM D, YYYY'),
            eventTime: event.startTime || 'TBA',
            eventVenue: event.venue || 'TBA',
            viewTicketLink: `${baseUrl}/tickets/${savedAudience._id}`,
            year: new Date().getFullYear(),
          },
          delay: delay48h,
          from: 'tickets@comfytag.com',
          userId: userId,
          notificationType: 'event_reminder',
        }).catch(err => console.error('[Reminder 48h] Queue failed:', err.message));

        // Email 2: 4 hours before event
        enqueueEmail({
          to: savedAudience.email,
          subject: `${event.name} starts in 4 hours — here's what you need`,
          template: 'eventReminder4h.hbs',
          data: {
            firstName: savedAudience.name.split(' ')[0],
            eventName: event.name,
            eventId: eventId,
            eventTime: event.startTime || 'TBA',
            eventAddress: event.address || 'TBA',
            eventVenue: event.venue || 'TBA',
            faceEnrolled: buyer?.faceEnrolled || false,
            appLink: `${baseUrl}/app`,
            ticketLink: `${baseUrl}/tickets/${savedAudience._id}`,
            year: new Date().getFullYear(),
          },
          delay: delay4h,
          from: 'tickets@comfytag.com',
          userId: userId,
          notificationType: 'event_reminder',
        }).catch(err => console.error('[Reminder 4h] Queue failed:', err.message));
    } catch (err) {
        next(err)
    }
}

// UPDATE
export const updateAudience = async (req, res, next) => {
    
    try {
        const updatedAudience = await Audience.findByIdAndUpdate(
              req.params.id,
            { $set: req.body },
            { new: true }
        )
         
        res.status(200).json(updatedAudience)
    } catch (err) {
        next(err)
    }
}

// DELETE
export const deleteAudience = async (req, res, next) => {
    const userId = req.params.userId;
    try {
        await Audience.findByIdAndDelete(
            req.params.id
        )
        try {
            await User.findByIdAndUpdate(userId, {
                 $pull: { events: req.params.id },
                 });
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

// GET
export const getAudience = async (req, res, next) => {
    try {
        const getAudience = await Audience.findById({ _id: req.params.id })
        res.status(200).json(getAudience)
    } catch (err) {
        next(err)
    }
}

// GET ALL
export const getAllAudience = async (req, res, next) => {
    try {
        const getAudience = await Audience.find()
        res.status(200).json(getAudience)
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
            ).catch(() => {})
        }
    } catch (err) {
        next(err)
    }
}

// GET ALL with pagination
export const getEventAudience = async (req, res, next) => {
    try {
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




