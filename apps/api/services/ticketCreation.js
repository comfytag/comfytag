import Event from '../models/Event.js'
import Audience from '../models/Audience.js'
import { createNotification } from '../controllers/notification.js'
import { enqueueEmail } from '../jobs/emailQueue.js'
import { QR } from '../utils/QRCode.js'
import { generateSecret } from 'otplib'
import moment from 'moment/moment.js'

export class TicketCreationError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'TicketCreationError'
    this.status = status
  }
}

// Creates a ticket for a confirmed payment: atomically decrements tier capacity,
// saves the Audience doc, and generates its QR code, then fires off (without
// blocking the caller) buyer/organizer notifications and the confirmation email.
//
// This is the one and only ticket-issuance code path — used both by createAudience
// (client calls it right after paying) and by the Paystack webhook's charge.success
// recovery branch (server calls it if a payment succeeded but the client never
// completed the create-ticket call, e.g. app crash/network drop after payment).
export const createPaidTicket = async ({
  event,
  eventId,
  tierName,
  numOfTicket,
  name,
  email,
  phone,
  userId,
  reference,
  serverAmount,
  organizerNet = 0,
  isFreeTicket,
  io,
}) => {
  const tier = event.ticketType.find(t => t.name === tierName)
  if (!tier) throw new TicketCreationError('Invalid ticket tier.', 400)

  // Atomic capacity check + decrement — $elemMatch scopes both the name match
  // and the sold guard to the same array element, so the positional $ operator
  // is unambiguous.
  const capacityFilter = tier.capacity > 0
    ? { _id: eventId, ticketType: { $elemMatch: { name: tierName, sold: { $lte: tier.capacity - numOfTicket } } } }
    : { _id: eventId, 'ticketType.name': tierName }

  const atomicEvent = await Event.findOneAndUpdate(
    capacityFilter,
    { $inc: { 'ticketType.$.sold': numOfTicket, sold: numOfTicket } },
    { new: true }
  )

  if (tier.capacity > 0 && !atomicEvent) {
    throw new TicketCreationError('Tickets sold out or insufficient capacity.', 409)
  }

  const existingTicketCount = await Audience.countDocuments({ event_id: eventId })

  const newAudience = new Audience({
    name,
    email,
    phone,
    eventname: event.name,
    numOfTicket,
    type: tierName,
    amount: serverAmount,
    organizerNet,
    reference,
    event_id: eventId,
    user_id: userId,
    totpSecret: generateSecret(),
    isFreeTicket,
    status: 'active',
    ticketNumber: existingTicketCount + 1,
  })

  const savedAudience = await newAudience.save()

  let qrCode = ''
  try {
    qrCode = await QR(savedAudience.reference)
    await Audience.findByIdAndUpdate(savedAudience._id, { qrCode })
    savedAudience.qrCode = qrCode
  } catch (qrErr) {
    console.log('QR generation failed:', qrErr.message)
  }

  // Fire-and-forget — the ticket already exists at this point; a notification
  // or email failure must never undo or block the purchase.
  sendPostPurchaseNotifications({ event, eventId, tierName, numOfTicket, savedAudience, qrCode, userId, io })
    .catch(err => console.error('[TicketCreation] Post-purchase notification failed:', err.message))

  return savedAudience
}

const sendPostPurchaseNotifications = async ({ event, eventId, tierName, numOfTicket, savedAudience, qrCode, userId, io }) => {
  const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

  await createNotification({
    userId,
    type: 'ticket_confirmed',
    title: 'Ticket confirmed ✓',
    message: `Your ticket to ${savedAudience.eventname} is ready`,
    data: {
      ticketId: savedAudience._id.toString(),
      eventId,
      eventName: savedAudience.eventname,
      reference: savedAudience.reference,
    },
    io,
  }).catch(err => console.error('[Notification] In-app creation failed:', err.message))

  if (event?.planner_id) {
    const netEarning = savedAudience.organizerNet || 0
    await createNotification({
      userId: event.planner_id,
      type: 'ticket_sold',
      title: 'New ticket sale 🎟',
      message: `${numOfTicket} ticket${numOfTicket > 1 ? 's' : ''} sold for ${savedAudience.eventname} — ₦${netEarning.toLocaleString('en-NG')}`,
      data: {
        eventId,
        eventName: savedAudience.eventname,
        ticketId: savedAudience._id.toString(),
        qty: String(numOfTicket),
        revenue: String(netEarning),
        tierName,
      },
      io,
    }).catch(err => console.error('[Notification] Organizer ticket_sold failed:', err.message))
  }

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
  })

  if (!ticketEmailResult.success) {
    console.error(`[TicketCreation] ERROR: Ticket confirmation email queue failed for ${savedAudience.email}: ${ticketEmailResult.error}`)
  }
}
