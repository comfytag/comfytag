import Event from '../models/Event.js'
import Audience from '../models/Audience.js'
import Withdraw from '../models/Withdraw.js'
import Follow from '../models/Follow.js'
import { createError } from '../utils/error.js'

// What the organizer actually nets from a ticket after their absorbed fee
// (see utils/ticketFees.js) — falls back to the full buyer-paid `amount` for
// tickets sold before organizerNet existed, so historical earnings aren't
// zeroed out by this field's introduction.
const netOf = (t) => t.organizerNet ?? t.amount ?? 0

// Shared balance calculation, reused by getPartnerRevenue and withdrawal validation.
export const computeAvailableBalance = async (userId) => {
  // Get all events for this partner
  const events = await Event.find({ planner_id: userId })
  const eventIds = events.map(e => e._id)

  // Get all tickets sold for these events
  const tickets = await Audience.find({
    event_id: { $in: eventIds },
    status: { $in: ['active', 'used', 'transferred'] },
  })

  // Calculate total revenue — organizerNet (subtotal minus the fee the
  // organizer absorbs, see utils/ticketFees.js) is what's actually payable to
  // them. Tickets created before that field existed have it as null; fall
  // back to the full `amount` for those so historical earnings aren't zeroed
  // out by this change.
  const totalRevenue = tickets.reduce((sum, t) => sum + netOf(t), 0)
  const totalTicketsSold = tickets.length

  // Get withdrawal stats
  const withdrawals = await Withdraw.find({ user_id: userId })
  const pendingWithdrawals = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)
  const approvedWithdrawals = withdrawals
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0)
  const sentWithdrawals = withdrawals
    .filter(w => w.status === 'sent')
    .reduce((sum, w) => sum + w.amount, 0)

  const availableBalance = totalRevenue - (pendingWithdrawals + approvedWithdrawals + sentWithdrawals)

  return {
    totalRevenue,
    totalTicketsSold,
    totalEvents: events.length,
    pendingWithdrawals,
    approvedWithdrawals,
    sentWithdrawals,
    availableBalance: Math.max(0, availableBalance),
  }
}

// GET /partner/:userId/revenue
// Get real partner balance: total revenue - withdrawals
export const getPartnerRevenue = async (req, res, next) => {
  try {
    const userId = req.params.userId

    if (!req.user.isAdmin) {
      const requesterId = (req.user._id ?? req.user.id ?? '').toString()
      if (requesterId !== userId) return next(createError(403, "Not authorized to view this partner's data"))
    }

    const balance = await computeAvailableBalance(userId)

    res.status(200).json({
      userId,
      ...balance,
    })
  } catch (err) {
    next(err)
  }
}

// GET /events/:id/analytics
// Per-event analytics: revenue, check-in rate, tier breakdown
export const getEventAnalytics = async (req, res, next) => {
  try {
    const eventId = req.params.id

    const event = await Event.findById(eventId)
    if (!event) return next(createError(404, 'Event not found'))

    if (!req.user.isAdmin) {
      const requesterId = (req.user._id ?? req.user.id ?? '').toString()
      if (event.planner_id?.toString() !== requesterId) return next(createError(403, 'Not authorized to view analytics for this event'))
    }

    // Get all tickets for this event
    const tickets = await Audience.find({ event_id: eventId })

    // Calculate totals — organizerNet reflects what the organizer actually
    // nets after their absorbed fee; showing the full buyer-paid `amount`
    // here would overstate what they'll receive.
    const totalRevenue = tickets.reduce((sum, t) => sum + netOf(t), 0)
    const totalTicketsSold = tickets.length
    const totalCapacity = event.ticketType.reduce((sum, t) => sum + t.capacity, 0)
    const checkInCount = tickets.filter(t => t.checkedIn).length
    const checkInRate = totalTicketsSold > 0 ? (checkInCount / totalTicketsSold) * 100 : 0

    // Daily sales breakdown
    const dailySales = {}
    tickets.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0]
      if (!dailySales[date]) {
        dailySales[date] = { sold: 0, revenue: 0 }
      }
      dailySales[date].sold += t.numOfTicket
      dailySales[date].revenue += netOf(t)
    })

    const dailySalesArray = Object.entries(dailySales).map(([date, data]) => ({
      date,
      sold: data.sold,
      revenue: data.revenue,
    }))

    // Per-tier stats
    const tierStats = event.ticketType.map(tier => {
      const tierTickets = tickets.filter(t => t.type === tier.name)
      const sold = tierTickets.reduce((sum, t) => sum + t.numOfTicket, 0)
      return {
        _id: tier._id,
        name: tier.name,
        price: tier.price,
        capacity: tier.capacity,
        sold,
        available: tier.capacity - sold,
        soldPercentage: tier.capacity > 0 ? (sold / tier.capacity) * 100 : 0,
      }
    })

    res.status(200).json({
      eventId,
      eventName: event.name,
      totalRevenue,
      totalTicketsSold,
      totalCapacity,
      checkInCount,
      checkInRate: Math.round(checkInRate * 100) / 100,
      dailySales: dailySalesArray,
      tierStats,
    })
  } catch (err) {
    next(err)
  }
}

// GET /partner/:userId/analytics
// Partner-level lifetime analytics
export const getPartnerAnalytics = async (req, res, next) => {
  try {
    const userId = req.params.userId

    if (!req.user.isAdmin) {
      const requesterId = (req.user._id ?? req.user.id ?? '').toString()
      if (requesterId !== userId) return next(createError(403, "Not authorized to view this partner's data"))
    }

    // Get all events for this partner
    const events = await Event.find({ planner_id: userId })
    const eventIds = events.map(e => e._id)

    // Get all tickets
    const tickets = await Audience.find({ event_id: { $in: eventIds } })

    // Calculate lifetime stats — organizerNet reflects what the organizer
    // actually nets after their absorbed fee.
    const totalLifetimeRevenue = tickets.reduce((sum, t) => sum + netOf(t), 0)
    const totalTicketsSold = tickets.length
    const averageTicketPrice = totalTicketsSold > 0 ? totalLifetimeRevenue / totalTicketsSold : 0

    // Monthly revenue breakdown
    const monthlyRevenue = {}
    tickets.forEach(t => {
      const date = new Date(t.createdAt)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = 0
      }
      monthlyRevenue[month] += netOf(t)
    })

    const monthlyRevenueArray = Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }))

    // Top events by revenue
    const topEvents = {}
    tickets.forEach(t => {
      if (!topEvents[t.event_id]) {
        topEvents[t.event_id] = { revenue: 0, eventName: t.eventname }
      }
      topEvents[t.event_id].revenue += netOf(t)
    })

    const topEventsArray = Object.entries(topEvents)
      .map(([eventId, data]) => ({
        eventId,
        eventName: data.eventName,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const followers = await Follow.countDocuments({ organizer_id: userId })

    // Aggregate ticketTypes across all events
    const ticketTypeMap = {}

    for (const event of events) {
      for (const tier of (event.ticketType ?? [])) {
        const key = tier.name
        if (!ticketTypeMap[key]) {
          ticketTypeMap[key] = { name: tier.name, sold: 0, capacity: 0, revenue: 0 }
        }
        ticketTypeMap[key].capacity += tier.capacity
      }
    }

    for (const ticket of tickets) {
      const key = ticket.type
      if (key && ticketTypeMap[key]) {
        ticketTypeMap[key].sold += (ticket.numOfTicket ?? 1)
        ticketTypeMap[key].revenue += netOf(ticket)
      }
    }

    const ticketTypes = Object.values(ticketTypeMap)

    res.status(200).json({
      userId,
      totalLifetimeRevenue,
      totalEvents: events.length,
      totalTicketsSold,
      followers,
      averageTicketPrice: Math.round(averageTicketPrice * 100) / 100,
      monthlyRevenue: monthlyRevenueArray,
      topEvents: topEventsArray,
      ticketTypes,
    })
  } catch (err) {
    next(err)
  }
}

// GET /events/:id/checkin-stats
// Real-time check-in stats for gate view
export const getCheckInStats = async (req, res, next) => {
  try {
    const eventId = req.params.id

    const event = await Event.findById(eventId)
    if (!event) return next(createError(404, 'Event not found'))

    if (!req.user.isAdmin) {
      const requesterId = (req.user._id ?? req.user.id ?? '').toString()
      if (event.planner_id?.toString() !== requesterId) return next(createError(403, 'Not authorized to view analytics for this event'))
    }

    const tickets = await Audience.find({ event_id: eventId })

    const totalCapacity = event.ticketType.reduce((sum, t) => sum + t.capacity, 0)
    const checkedIn = tickets.filter(t => t.checkedIn).length
    const checkInRate = totalCapacity > 0 ? (checkedIn / totalCapacity) * 100 : 0

    // Per-tier breakdown
    const byTier = event.ticketType.map(tier => {
      const tierTickets = tickets.filter(t => t.type === tier.name)
      const tierCheckedIn = tierTickets.filter(t => t.checkedIn).length
      return {
        tierName: tier.name,
        capacity: tier.capacity,
        checkedIn: tierCheckedIn,
      }
    })

    // By method breakdown
    const byMethod = {
      face: tickets.filter(t => t.checkedInMethod === 'face').length,
      qr: tickets.filter(t => t.checkedInMethod === 'qr').length,
      manual: tickets.filter(t => t.checkedInMethod === 'manual').length,
    }

    res.status(200).json({
      eventId,
      totalCapacity,
      checkedIn,
      remaining: totalCapacity - checkedIn,
      checkInRate: Math.round(checkInRate * 100) / 100,
      byTier,
      byMethod,
    })
  } catch (err) {
    next(err)
  }
}
