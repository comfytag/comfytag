import cron from 'node-cron'
import Event from '../models/Event.js'
import Audience from '../models/Audience.js'
import Notification from '../models/Notification.js'
import Follow from '../models/Follow.js'
import User from '../models/User.js'
import { createNotification } from '../controllers/notification.js'
import { enqueueEmail } from './emailQueue.js'
import { getGlobalIoInstance } from '../socket/index.js'

// Two reminder windows: 24h before and 2h before
const REMINDER_WINDOWS = [
  { label: '24h', offsetMs: 24 * 60 * 60 * 1000, title: 'Your event is tomorrow!', msgSuffix: 'is tomorrow', emailTemplate: 'eventReminder48h.hbs', emailSubject: (name) => `Don't miss ${name} — it's tomorrow!` },
  { label: '2h',  offsetMs:  2 * 60 * 60 * 1000, title: 'Your event starts soon!',  msgSuffix: 'starts in about 2 hours', emailTemplate: 'eventReminder4h.hbs', emailSubject: (name) => `${name} starts in 2 hours — get your ticket now` },
]

// Half the cron interval on each side to avoid double-firing at boundaries
const HALF_WINDOW_MS = 15 * 60 * 1000  // ±15 min (cron runs every 30 min)

const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

async function sendEventReminders() {
  const io = getGlobalIoInstance()
  const now = Date.now()

  for (const window of REMINDER_WINDOWS) {
    const start = new Date(now + window.offsetMs - HALF_WINDOW_MS)
    const end   = new Date(now + window.offsetMs + HALF_WINDOW_MS)

    const events = await Event.find({
      status: 'published',
      event_date: { $gte: start, $lte: end },
    }).select('_id name planner_id startTime venue').lean()

    for (const event of events) {
      const eventId = event._id.toString()

      // Deduplicate: skip if we already fired this window for this event
      const alreadySent = await Notification.exists({
        type: 'event_reminder',
        'data.eventId': eventId,
        'data.reminderType': window.label,
      })
      if (alreadySent) continue

      // Get every active ticket holder (exclude anonymous guest claims)
      const purchaserIds = await Audience.distinct('user_id', {
        event_id: event._id,
        status: 'active',
        user_id: { $nin: ['guest', ''] },
      })

      // ── In-app notifications for ticket holders ───────────────────────────
      if (purchaserIds.length) {
        await Promise.allSettled(
          purchaserIds.map((userId) =>
            createNotification({
              userId,
              type: 'event_reminder',
              title: window.title,
              message: `${event.name} ${window.msgSuffix}. Get ready!`,
              data: {
                eventId,
                eventName: event.name,
                reminderType: window.label,
              },
              io,
            })
          )
        )

        console.log(`[EventReminder] Sent ${window.label} in-app reminder for "${event.name}" to ${purchaserIds.length} attendee(s)`)
      }

      // ── Follower conversion emails (non-purchasers who follow the organizer) ─
      const purchaserSet = new Set(purchaserIds.map(String))

      const follows = await Follow.find({ organizer_id: event.planner_id.toString() })
        .select('follower_id')
        .lean()

      if (!follows.length) continue

      const nonPurchaserFollowerIds = follows
        .map((f) => f.follower_id)
        .filter((id) => !purchaserSet.has(String(id)))

      if (!nonPurchaserFollowerIds.length) continue

      const followers = await User.find({ _id: { $in: nonPurchaserFollowerIds } })
        .select('email name')
        .lean()

      await Promise.allSettled(
        followers.map((follower) =>
          enqueueEmail({
            to: follower.email,
            subject: window.emailSubject(event.name),
            template: window.emailTemplate,
            data: {
              firstName: follower.name?.split(' ')[0] || '',
              eventName: event.name,
              eventId,
              eventTime: event.startTime || 'TBA',
              eventVenue: event.venue || 'TBA',
              purchaseLink: `${baseUrl}/events/${eventId}`,
              year: new Date().getFullYear(),
              unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
              preferencesUrl: `${baseUrl}/preferences`,
            },
            from: 'events@comfytag.com',
          }).catch((err) =>
            console.error(`[EventReminder] Follower email failed for ${follower.email}:`, err.message)
          )
        )
      )

      console.log(`[EventReminder] Sent ${window.label} follower emails for "${event.name}" to ${followers.length} non-purchaser follower(s)`)
    }
  }
}

export function scheduleEventReminders() {
  // Runs every 30 minutes — cheap: one indexed MongoDB query per window per run
  cron.schedule('*/30 * * * *', () => {
    sendEventReminders().catch((err) =>
      console.error('[EventReminder] Job failed:', err.message)
    )
  })
  console.log('[Jobs] Event reminder job scheduled — runs every 30 minutes')
}
