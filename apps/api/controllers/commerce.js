import crypto from 'crypto'
import { generateSync } from 'otplib'
import Event from '../models/Event.js'
import User from '../models/User.js'
import Audience from '../models/Audience.js'
import Referral from '../models/Referral.js'
import Wallet from '../models/Wallet.js'
import Alert from '../models/Alert.js'
import Withdraw from '../models/Withdraw.js'
import { createError } from '../utils/error.js'
import { verifyAndCheckPaystackReference } from '../utils/paystack.js'
import { calculateTicketCharge } from '../utils/ticketFees.js'
import { createPaidTicket } from '../services/ticketCreation.js'
import { createNotification, notifyAdmins } from './notification.js'


// ─── Search Controllers ───────────────────────────────────────────────────────

// GET /events/search
export const searchEvents = async (req, res, next) => {
  try {
    const {
      q,
      category,
      city,
      priceMax,
      priceMin,
      date,
      dateFrom,
      dateTo,
      featured,
      showPast,
      page = 1,
      limit = 20,
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const filter = {}
    let sort = { createdAt: -1 }
    let projection = {}

    // Handle past vs. upcoming events
    const isPastMode = showPast === 'true'
    if (isPastMode) {
      filter.date = { $lt: new Date() }
      filter.status = { $in: ['published', 'ended', 'cancelled'] }
      sort = { date: -1 } // Most recent past first
    } else {
      filter.status = 'published'
      if (!date) {
        // Default: future events only (fixes leak in unfiltered search)
        filter.date = { $gte: new Date() }
      }
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')
      filter.$or = [
        { name: regex },
        { venue: regex },
        { planner: regex },
        { address: regex },
        { state: regex },
      ]
    }

    if (category) {
      const cats = category.split(',').map(c => c.trim()).filter(Boolean)
      if (cats.length === 1) {
        filter.category = new RegExp(`^${cats[0]}$`, 'i')
      } else {
        filter.category = { $in: cats.map(c => new RegExp(`^${c}$`, 'i')) }
      }
    }

    if (city) filter.state = { $regex: new RegExp(city, 'i') }

    if (req.query.state) filter.state = { $regex: new RegExp(req.query.state, 'i') }

    if (featured === 'true') filter.featured = true

    if (date) {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

      if (date === 'today') {
        filter.date = { $gte: todayStart, $lte: todayEnd }
      } else if (date === 'tomorrow') {
        const tomorrowStart = new Date(todayStart)
        tomorrowStart.setDate(tomorrowStart.getDate() + 1)
        const tomorrowEnd = new Date(todayEnd)
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
        filter.date = { $gte: tomorrowStart, $lte: tomorrowEnd }
      } else if (date === 'weekend') {
        const dayOfWeek = now.getDay() // 0=Sun, 6=Sat
        const daysUntilSat = dayOfWeek === 6 ? 0 : (6 - dayOfWeek)
        const saturdayStart = new Date(todayStart)
        saturdayStart.setDate(saturdayStart.getDate() + daysUntilSat)
        const sundayEnd = new Date(saturdayStart)
        sundayEnd.setDate(sundayEnd.getDate() + 1)
        sundayEnd.setHours(23, 59, 59)
        filter.date = { $gte: saturdayStart, $lte: sundayEnd }
      }
    }

    // Explicit date range (from the discovery page's date-range filter) — merges
    // on top of the preset/past-mode bounds above rather than replacing them.
    if (dateFrom || dateTo) {
      filter.date = filter.date || {}
      if (dateFrom) filter.date.$gte = new Date(dateFrom)
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        filter.date.$lte = end
      }
    }

    if (priceMax || priceMin) {
      filter['ticketType.price'] = {}
      if (priceMin) filter['ticketType.price'].$gte = parseFloat(priceMin)
      if (priceMax) filter['ticketType.price'].$lte = parseFloat(priceMax)
    }

    const [results, total] = await Promise.all([
      Event.find(filter, projection).sort(sort).skip(skip).limit(limitNum).lean(),
      Event.countDocuments(filter),
    ])

    const normalized = results.map(e => ({
      ...e,
      date: e.date ?? e.event_date ?? null
    }));

    res.status(200).json({
      success: true,
      data: normalized,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + normalized.length < total,
    })
  } catch (err) {
    next(err)
  }
}

// GET /search/suggestions
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query

    if (!q || q.length < 2) {
      return res.status(200).json({ events: [], artists: [], organizers: [] })
    }

    const regex = new RegExp(q, 'i')

    const [eventResults, organizerResults, artistEvents] = await Promise.all([
      Event.find({ name: regex, status: 'published' })
        .select('name date state images')
        .limit(3),
      User.find({
        isPartner: true,
        $or: [{ name: regex }, { businessName: regex }],
      })
        .select('name businessName image')
        .limit(3),
      Event.find({ 'performers.name': regex, status: 'published' })
        .select('performers')
        .limit(20),
    ])

    // Extract unique performer objects matching the query
    const seenNames = new Set()
    const artists = []
    for (const event of artistEvents) {
      if (!event.performers) continue
      for (const performer of event.performers) {
        if (
          performer.name &&
          regex.test(performer.name) &&
          !seenNames.has(performer.name)
        ) {
          seenNames.add(performer.name)
          artists.push(performer)
          if (artists.length >= 3) break
        }
      }
      if (artists.length >= 3) break
    }

    res.status(200).json({ events: eventResults, artists, organizers: organizerResults })
  } catch (err) {
    next(err)
  }
}

// GET /search/trending
export const getTrending = async (req, res, next) => {
  try {
    const data = await Event.find({
      status: 'published',
      date: { $gte: new Date() },
    })
      .sort({ sold: -1 })
      .limit(6)

    res.status(200).json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

// ─── Alert Controller ─────────────────────────────────────────────────────────

// POST /alerts (auth)
export const createAlert = async (req, res, next) => {
  try {
    const { type, value } = req.body

    const alert = await Alert.findOneAndUpdate(
      { user_id: req.user.id, type, value },
      { user_id: req.user.id, type, value },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.status(200).json({ success: true, data: alert })
  } catch (err) {
    next(err)
  }
}

// ─── Referral Controllers ─────────────────────────────────────────────────────

// GET /referral/:eventId (auth)
export const getReferralCode = async (req, res, next) => {
  try {
    const { eventId } = req.params

    let referral = await Referral.findOne({
      referrer_id: req.user.id,
      event_id: eventId,
    })

    if (!referral) {
      const code = 'ref_' + Math.random().toString(36).substr(2, 8)
      referral = await Referral.create({
        referrer_id: req.user.id,
        event_id: eventId,
        code,
      })
    }

    const event = await Event.findById(eventId).select('name')
    const eventName = event?.name || ''
    const baseUrl = process.env.WEB_URL || 'http://localhost:3000'
    const url = `${baseUrl}/events/${eventId}?ref=${referral.code}`

    res.status(200).json({
      success: true,
      data: { ...referral.toObject(), url, eventName },
    })
  } catch (err) {
    next(err)
  }
}

// POST /referral/apply (auth)
export const applyReferral = async (req, res, next) => {
  try {
    const { code, ticketId } = req.body

    const referral = await Referral.findOne({ code })
    if (!referral) return next(createError(404, 'Referral code not found'))

    const ticket = await Audience.findById(ticketId)
    if (!ticket) return next(createError(404, 'Ticket not found'))

    if (ticket.event_id !== referral.event_id.toString()) {
      return next(createError(400, 'Referral code does not match this event'))
    }

    if (referral.referrer_id === ticket.user_id) {
      return res.status(200).json({ success: true, credited: false, reason: 'self-referral' })
    }

    if (ticket.referralRedeemed) {
      return res.status(200).json({ success: true, credited: false, reason: 'already-redeemed' })
    }

    // Atomic claim closes the race between two concurrent calls for the same ticket.
    const claimed = await Audience.findOneAndUpdate(
      { _id: ticketId, referralRedeemed: { $ne: true } },
      { $set: { referralRedeemed: true, referralCreditedAt: new Date() } },
      { new: true }
    )
    if (!claimed) {
      return res.status(200).json({ success: true, credited: false, reason: 'already-redeemed' })
    }

    // Credit ₦500 to referrer wallet
    await Wallet.findOneAndUpdate(
      { user_id: referral.referrer_id },
      {
        $inc: { balance: 500 },
        $push: {
          transactions: {
            type: 'credit',
            amount: 500,
            reason: 'Referral conversion',
            referenceId: ticketId,
          },
        },
      },
      { upsert: true, new: true }
    )

    await Referral.findByIdAndUpdate(referral._id, {
      $inc: { conversions: 1, total_credited: 500 },
    })

    res.status(200).json({ success: true, credited: true, amount: 500 })
  } catch (err) {
    next(err)
  }
}

// ─── Wallet Controller ────────────────────────────────────────────────────────

// GET /wallet (auth)
export const getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user_id: req.user.id })

    if (!wallet) {
      return res.status(200).json({ success: true, data: { balance: 0, transactions: [] } })
    }

    res.status(200).json({ success: true, data: wallet })
  } catch (err) {
    next(err)
  }
}

// ─── TOTP Controller ──────────────────────────────────────────────────────────

// GET /tickets/:id/token (auth)
export const getTicketToken = async (req, res, next) => {
  try {
    const ticket = await Audience.findById(req.params.id).select('+totpSecret')
    if (!ticket) return next(createError(404, 'Ticket not found'))

    if (ticket.user_id !== req.user.id) {
      return next(createError(403, 'You are not authorized to view this ticket token'))
    }

    const token = generateSync({ secret: ticket.totpSecret })
    const step = 30
    const timeRemaining = step - (Math.floor(Date.now() / 1000) % step)

    res.status(200).json({ success: true, token, validFor: timeRemaining })
  } catch (err) {
    next(err)
  }
}

// ─── SSE Controller ───────────────────────────────────────────────────────────

// GET /tickets/:id/status (auth)
export const getTicketStatus = async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.removeHeader('X-Accel-Buffering')

    // Send immediate status
    const ticket = await Audience.findById(req.params.id).select('checkedIn checkedInAt')
    if (!ticket) {
      res.write(`data: ${JSON.stringify({ error: 'Ticket not found' })}\n\n`)
      return res.end()
    }

    res.write(`data: ${JSON.stringify({ checkedIn: ticket.checkedIn, checkedInAt: ticket.checkedInAt })}\n\n`)

    const interval = setInterval(async () => {
      try {
        const updated = await Audience.findById(req.params.id).select('checkedIn checkedInAt')
        if (updated) {
          res.write(`data: ${JSON.stringify({ checkedIn: updated.checkedIn, checkedInAt: updated.checkedInAt })}\n\n`)
        }
      } catch {
        // Silently ignore poll errors — connection may be closing
      }
    }, 5000)

    req.on('close', () => {
      clearInterval(interval)
      res.end()
    })
  } catch (err) {
    next(err)
  }
}

// ─── Paystack Webhook Controller ─────────────────────────────────────────────

// Recovery path: if a client's payment succeeded but it never got as far as
// calling POST /audience/:userId/:eventId (app crash, closed tab, dropped
// network right after paying), the ticket would otherwise be lost. Requires
// `metadata` to have been attached to the transaction at PaystackPop.setup()
// time on the web/mobile checkout screens.
const handleChargeSuccess = async (event, io) => {
  const reference = event.data?.reference
  if (!reference) return

  const existing = await Audience.findOne({ reference }).select('_id').lean()
  if (existing) return // already created — nothing to recover

  const metadata = event.data?.metadata
  const { eventId, tierName, numOfTicket, userId, name, email, phone } = metadata || {}
  if (!eventId || !tierName || !numOfTicket || !userId) {
    console.error('[Webhook] charge.success recovery skipped — incomplete metadata for reference', reference)
    return
  }

  const eventDoc = await Event.findById(eventId)
  if (!eventDoc) {
    console.error('[Webhook] charge.success recovery skipped — event not found:', eventId)
    return
  }

  const tier = eventDoc.ticketType.find(t => t.name === tierName)
  if (!tier) {
    console.error('[Webhook] charge.success recovery skipped — invalid tier:', tierName)
    return
  }

  // Re-derive the expected charge server-side rather than trusting
  // event.data.amount blindly — see utils/ticketFees.js.
  const charge = calculateTicketCharge(tier.price, numOfTicket)
  if (event.data.amount !== charge.totalCharge * 100) {
    console.error('[Webhook] charge.success recovery skipped — amount mismatch for reference', reference)
    return
  }

  await createPaidTicket({
    event: eventDoc,
    eventId,
    tierName,
    numOfTicket,
    name,
    email,
    phone,
    userId,
    reference,
    serverAmount: charge.totalCharge,
    organizerNet: charge.organizerNet,
    isFreeTicket: false,
    io,
  })
}

// Paystack accepting a transfer request (processPayout) isn't the same as the
// money having moved — these two handlers are what actually confirm/deny a
// payout, driven by the transfer_code minted when the transfer was initiated.
const findWithdrawForTransferEvent = async (event) => {
  const transferCode = event.data?.transfer_code
  const reference = event.data?.reference
  return Withdraw.findOne(
    transferCode ? { transferCode } : { transferReference: reference }
  )
}

const handleTransferSuccess = async (event, io) => {
  const withdrawal = await findWithdrawForTransferEvent(event)
  if (!withdrawal) {
    console.error('[Webhook] transfer.success — no matching Withdraw for transfer_code', event.data?.transfer_code)
    return
  }
  if (withdrawal.status === 'sent') return // already processed

  withdrawal.status = 'sent'
  await withdrawal.save()

  await createNotification({
    userId: withdrawal.user_id,
    type: 'payout_approved',
    title: 'Payout sent ✓',
    message: `₦${withdrawal.amount.toLocaleString()} has been sent to your ${withdrawal.bankName} account`,
    data: {
      amount: withdrawal.amount,
      bankName: withdrawal.bankName,
      acctName: withdrawal.acctName,
      withdrawId: withdrawal._id.toString(),
    },
    io,
  }).catch(err => console.error('[Notification] Payout sent failed:', err.message))
}

const handleTransferFailed = async (event, io) => {
  const withdrawal = await findWithdrawForTransferEvent(event)
  if (!withdrawal) {
    console.error('[Webhook] transfer.failed — no matching Withdraw for transfer_code', event.data?.transfer_code)
    return
  }
  if (withdrawal.status === 'failed') return // already processed

  const failureReason = event.data?.reason || event.data?.message || 'Transfer failed at Paystack'
  withdrawal.status = 'failed'
  withdrawal.failureReason = failureReason
  await withdrawal.save()

  await createNotification({
    userId: withdrawal.user_id,
    type: 'payout_rejected',
    title: 'Payout failed',
    message: 'Your payout could not be completed. Our team has been notified.',
    data: {
      amount: withdrawal.amount,
      rejectionReason: failureReason,
      withdrawId: withdrawal._id.toString(),
    },
    io,
  }).catch(err => console.error('[Notification] Payout failed notification error:', err.message))

  notifyAdmins({
    roles: ['finance'],
    type: 'payout_requested',
    title: 'Payout transfer failed',
    message: `₦${withdrawal.amount.toLocaleString()} transfer to ${withdrawal.bankName} failed: ${failureReason}`,
    data: {
      withdrawId: withdrawal._id.toString(),
      amount: String(withdrawal.amount),
      bankName: withdrawal.bankName,
    },
    io,
  }).catch(err => console.error('[Notification] Finance admin transfer-failed alert failed:', err.message))
}

// POST /paystack/webhook
// Paystack calls this server-to-server — NO JWT auth. HMAC validates the sender.
export const handlePaystackWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature']
    if (!signature) {
      return res.status(401).json({ message: 'Missing signature' })
    }

    // Compute expected HMAC-SHA512 over the raw request body (re-serialised JSON)
    const expected = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex')

    // Constant-time comparison to prevent timing attacks
    let signatureValid = false
    try {
      const expectedBuf = Buffer.from(expected, 'hex')
      const sigBuf = Buffer.from(signature, 'hex')
      signatureValid =
        expectedBuf.length === sigBuf.length &&
        crypto.timingSafeEqual(expectedBuf, sigBuf)
    } catch {
      signatureValid = false
    }

    if (!signatureValid) {
      return res.status(401).json({ message: 'Invalid signature' })
    }

    // Acknowledge receipt within Paystack's 5-second window
    res.status(200).json({ received: true })

    // Fire-and-forget from here on — the ack above already went out, so every
    // branch below must log rather than throw.
    const event = req.body
    const io = req.app.locals.io

    switch (event?.event) {
      case 'charge.success':
        handleChargeSuccess(event, io).catch(err =>
          console.error('[Webhook] charge.success handling failed:', err.message)
        )
        break
      case 'transfer.success':
        handleTransferSuccess(event, io).catch(err =>
          console.error('[Webhook] transfer.success handling failed:', err.message)
        )
        break
      case 'transfer.failed':
      case 'transfer.reversed':
        handleTransferFailed(event, io).catch(err =>
          console.error('[Webhook] transfer.failed handling failed:', err.message)
        )
        break
      default:
        // Other event types are not handled.
        break
    }
  } catch (err) {
    next(err)
  }
}

// ─── Seasonal Config Controller ───────────────────────────────────────────────

// GET /config/seasonal
export const getSeasonalConfig = (req, res) => {
  const month = new Date().getMonth() + 1
  const isDettyDecember = month === 11 || month === 12 || month === 1

  res.status(200).json({
    isDettyDecember,
    banner: isDettyDecember
      ? {
          title: 'Detty December is Here 🌴',
          subtitle: 'The best events of the year are dropping',
          gradient: 'linear-gradient(135deg, #D97706, #065F46)',
        }
      : null,
  })
}

// ─── Paystack Verification Controller ────────────────────────────────────────

// POST /paystack/verify/:reference
export const verifyPaystackPayment = async (req, res, next) => {
  try {
    const { reference } = req.params

    // Idempotency: a reference that already created a ticket must not be re-used
    const existing = await Audience.findOne({ reference }).select('_id').lean()
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This payment reference has already been processed.',
      })
    }

    const { ok, reason, data } = await verifyAndCheckPaystackReference(reference)

    if (!data) {
      return res.status(400).json({
        success: false,
        message: reason || 'Invalid response from Paystack',
      })
    }

    const { status, amount, paid_at } = data
    const amountNaira = amount !== undefined ? amount / 100 : undefined

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: reason,
        data: { status, amount: amountNaira, paid_at, charged: false },
      })
    }

    res.status(200).json({
      success: true,
      data: {
        status,
        amount: amountNaira,
        paid_at,
        charged: true,
      },
    })
  } catch (err) {
    next(err)
  }
}
