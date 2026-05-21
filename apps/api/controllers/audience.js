
import Event from '../models/Event.js'
import Audience from '../models/Audience.js';
import User from '../models/User.js';
import { createError } from '../utils/error.js'
import { sendTicket } from '../utils/sendEmail.js';
import moment from 'moment/moment.js';
import { QR } from '../utils/QRCode.js';
import { generateSecret } from 'otplib'



// CREATE FREE TICKET (no payment / no auth required)
export const createFreeAudience = async (req, res, next) => {
    const { name, email, phone, eventname, numOfTicket, type, userId } = req.body
    const eventId = req.params.eventId
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
    try {
        const savedAudience = await newAudience.save()
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
        </div>`
        await sendTicket(savedAudience.email, savedAudience.eventname + ' ticket', text, details)
    } catch (err) {
        next(err)
    }
}

// CREATE
export const createAudience = async (req, res, next) => {
    const eventId = req.params.eventId;
    const userId = req.params.userId;
    const newAudience = new Audience({
        ...req.body,
         event_id: eventId,
         user_id: userId,
         totpSecret: generateSecret(),
     });
    try {
        const savedAudience = await newAudience.save()

        try {
        const audienceCount =  savedAudience.numOfTicket

            await Event.findByIdAndUpdate(eventId, {
                 $inc: {sold: + audienceCount}
                 });
        } catch (err) {
            next(err)
        }
        res.status(200).json(savedAudience)
        const text = 'Please download your ticket'
        const details =  (`<div>
        <p style={{fontSize : bold}}>Download your ticket</p>
        Name : ${savedAudience.name} <br/>
        Event : ${savedAudience.eventname} <br/>
        Number of tickets : ${savedAudience.numOfTicket} <br/>
        Ticket type : ${savedAudience.type} <br/>
        Amount paid :  ${savedAudience.amount} <br/>
        Date : ${moment(savedAudience.createdAt).format("YYYY-MM-DD")} <br/>
        </div>`)

        // Generate QR code for ticket
        let qrCode = ''
        try {
          qrCode = await QR(savedAudience.reference)
        } catch (qrErr) {
          console.log('QR generation failed:', qrErr.message)
        }

        // Add QR code to email if generated
        const emailDetails = qrCode
          ? `${details}<br/><img src="${qrCode}" alt="Ticket QR Code" width="200" height="200" />`
          : details

        await sendTicket(savedAudience.email, savedAudience.eventname +" ticket", text, emailDetails);
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
        const getUserAudienceAll = await Audience.find({ user_id: req.params.userId })
        res.status(200).json(getUserAudienceAll)
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

// const  details = `<div>
//     Name : ${savedAudience.name} \n
//     Event : ${savedAudience.eventname} \n
//     Number of tickets : ${savedAudience.numOfTicket} \n
//     Ticket type : ${savedAudience.type} \n
//     Amount paid :  ${savedAudience.amount} \n
//     Date : ${moment(savedAudience.createdAt).format("YYYY-MM-DD")} \n
//     </div>`




