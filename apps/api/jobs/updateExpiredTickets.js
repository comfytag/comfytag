import Audience from '../models/Audience.js'
import Event from '../models/Event.js'

export async function updateExpiredTickets() {
  try {
    const now = new Date()

    // Find all events that have already passed
    const expiredEvents = await Event.find({ date: { $lt: now } }).select('_id').lean()
    const expiredEventIds = expiredEvents.map(e => e._id)

    if (expiredEventIds.length === 0) {
      console.log('[TicketStatusJob] No expired events found')
      return
    }

    // Update all active tickets for expired events to 'ended'
    const result = await Audience.updateMany(
      {
        event_id: { $in: expiredEventIds },
        status: 'active',
      },
      { status: 'ended' }
    )

    console.log(
      `[TicketStatusJob] Updated ${result.modifiedCount} tickets from active to ended`
    )

    return result
  } catch (err) {
    console.error('[TicketStatusJob] Error:', err.message)
  }
}
