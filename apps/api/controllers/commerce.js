import https from 'https'
import { generateSync } from 'otplib'
import Event from '../models/Event.js'
import User from '../models/User.js'
import Audience from '../models/Audience.js'
import Referral from '../models/Referral.js'
import Wallet from '../models/Wallet.js'
import Alert from '../models/Alert.js'
import { createError } from '../utils/error.js'


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
      featured,
      page = 1,
      limit = 20,
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const filter = { status: 'published' }
    let sort = { createdAt: -1 }
    let projection = {}

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

    if (category) filter.category = category

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

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.paystack.co',
        path: `/transaction/verify/${encodeURIComponent(reference)}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }

      const request = https.request(options, (response) => {
        let body = ''
        response.on('data', (chunk) => { body += chunk })
        response.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch {
            reject(new Error('Invalid JSON from Paystack'))
          }
        })
      })

      request.on('error', reject)
      request.end()
    })

    const { status, amount, paid_at } = data.data
    const amountNaira = amount / 100

    res.status(200).json({
      success: true,
      data: {
        status,
        amount: amountNaira,
        paid_at,
        charged: status === 'success',
      },
    })
  } catch (err) {
    next(err)
  }
}
