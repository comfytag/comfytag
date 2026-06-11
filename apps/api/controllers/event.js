
import moment from 'moment/moment.js';
import Event from '../models/Event.js'
import User from '../models/User.js';
import Follow from '../models/Follow.js'
import Notification from '../models/Notification.js'
import Audience from '../models/Audience.js'
import Withdraw from '../models/Withdraw.js'
import { createError } from '../utils/error.js'
import { enqueueEmail, enqueueBulkEmails } from '../jobs/emailQueue.js'
import { createNotification } from './notification.js'

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}


// CREATE
export const createEvent = async (req, res, next) => {
    const userId = req.params.userId;

    // Get event planner username
    const getUser = await User.findById(userId)
    if (!getUser) return next(createError(404, 'User not found'))
    const {username} = getUser._doc

    // Sanitize promos: filter out entries without a valid code
    let eventData = { ...req.body };
    if (eventData.promos && Array.isArray(eventData.promos)) {
        eventData.promos = eventData.promos.filter(promo => promo && promo.code);
    }

    //  Add new event and fetch plannerId and planner name
    const newEvent = new Event({
        ...eventData,
         planner_id: userId,
         planner: username,
         slug: toSlug(req.body.name) + '-' + Date.now().toString(36),
     });
    try {
        const savedEvent = await newEvent.save()
        // Push eventId to user event list
        await User.findByIdAndUpdate(userId, {
             $push: { events: savedEvent._id },
        }).catch(err => {
            console.error('[Event Create] Failed to update user events:', err.message);
        });

        res.status(201).json(savedEvent)
    } catch (err) {
        next(err)
    }
}

// UPDATE
export const updateEvent = async (req, res, next) => {

    try {
        // Sanitize promos: filter out entries without a valid code
        let updateData = { ...req.body };
        if (updateData.promos && Array.isArray(updateData.promos)) {
            updateData.promos = updateData.promos.filter(promo => promo && promo.code);
        }

        // Compute totalCapacity if ticketType is being updated
        if (updateData.ticketType) {
            updateData.totalCapacity = updateData.ticketType.reduce(
                (sum, t) => sum + (t.capacity || 0), 0
            );
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
        const baseUrl = process.env.BASE_URL || 'https://comfytag.com';
        const newStatus = req.body.status;

        // ─── FLOW 3B & 3C: POST-EVENT RECAP + ORGANIZER REPORT ────────────────
        if (newStatus === 'ended') {
          const attendees = await Audience.find({ event_id: updatedEvent._id, status: 'active' });
          const organizer = await User.findById(updatedEvent.planner_id);

          if (organizer && attendees.length > 0) {
            const attendeeCount = attendees.length;
            const checkedInCount = attendees.filter(a => a.checkedIn).length;
            const attendanceRate = attendeeCount > 0 ? Math.round((checkedInCount / attendeeCount) * 100) : 0;

            // Check-in method breakdown
            const faceCheckIns = attendees.filter(a => a.checkedInMethod === 'face').length;
            const qrCheckIns = attendees.filter(a => a.checkedInMethod === 'qr').length;
            const manualCheckIns = attendees.filter(a => a.checkedInMethod === 'manual').length;

            const facePercent = attendeeCount > 0 ? Math.round((faceCheckIns / attendeeCount) * 100) : 0;
            const qrPercent = attendeeCount > 0 ? Math.round((qrCheckIns / attendeeCount) * 100) : 0;
            const manualPercent = attendeeCount > 0 ? Math.round((manualCheckIns / attendeeCount) * 100) : 0;

            // Revenue calculation
            const grossRevenue = attendees.reduce((sum, a) => sum + (a.amount || 0), 0);
            const platformFee = Math.round(grossRevenue * 0.04);
            const netRevenue = grossRevenue - platformFee;

            // ─── FLOW 3B: Attendee Recap Emails ────────────────────────
            for (const attendee of attendees) {
              // Email 1: Immediate recap (fire-and-forget)
              enqueueEmail({
                to: attendee.email,
                subject: `That was amazing — thanks for coming 🎉`,
                template: 'postEventRecap1.hbs',
                data: {
                  firstName: attendee.name.split(' ')[0],
                  eventName: updatedEvent.name,
                  eventId: updatedEvent._id,
                  attendeeCount,
                  rateLink: `${baseUrl}/events/${updatedEvent._id}/rate`,
                  year: new Date().getFullYear(),
                  unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
                  preferencesUrl: `${baseUrl}/preferences`,
                },
                from: 'events@comfytag.com',
                userId: attendee.user_id.toString(),
                notificationType: 'event_recap',
              }).catch(err => console.error('[Recap Email 1] Queue failed:', err.message));

              // Email 2: +5 days discovery recommendations (scheduled)
              const similarEvents = await Event.find({
                category: updatedEvent.category,
                state: updatedEvent.state,
                date: { $gt: new Date() },
                status: 'published',
                _id: { $ne: updatedEvent._id },
              }).limit(3).lean();

              enqueueEmail({
                to: attendee.email,
                subject: `Similar events you'd love (based on ${updatedEvent.category})`,
                template: 'postEventRecap2.hbs',
                data: {
                  firstName: attendee.name.split(' ')[0],
                  eventName: updatedEvent.name,
                  eventId: updatedEvent._id,
                  interestCategory: updatedEvent.category,
                  state: updatedEvent.state,
                  recommendedEvents: similarEvents.map(e => ({
                    name: e.name,
                    date: moment(e.date).format('MMM D'),
                    price: e.ticketType?.length > 0 ? `₦${e.ticketType[0].price}` : 'TBA',
                    location: e.venue || 'TBA',
                    link: `${baseUrl}/events/${e._id}`,
                  })),
                  browseLink: `${baseUrl}/events?category=${updatedEvent.category}&state=${updatedEvent.state}`,
                  browseButtonText: `Browse All ${updatedEvent.category} Events`,
                  year: new Date().getFullYear(),
                  unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
                  preferencesUrl: `${baseUrl}/preferences`,
                },
                delay: 5 * 24 * 60 * 60 * 1000,
                from: 'hello@comfytag.com',
                replyTo: 'hello@comfytag.com',
                userId: attendee.user_id.toString(),
                notificationType: 'event_recap',
              }).catch(err => console.error('[Recap Email 2] Queue failed:', err.message));
            }

            // ─── FLOW 3C: Organizer Performance Report ────────────────────────
            const hasPendingWithdraw = await Withdraw.findOne({
              user_id: organizer._id,
              status: 'pending',
            });

            enqueueEmail({
              to: organizer.email,
              subject: `Your ${updatedEvent.name} recap — ${attendeeCount} tickets, ₦${grossRevenue.toLocaleString()} earned`,
              template: 'organizerPerformanceReport.hbs',
              data: {
                organizerName: organizer.name || organizer.email,
                eventName: updatedEvent.name,
                totalTicketsSold: attendeeCount,
                grossRevenue: `₦${grossRevenue.toLocaleString()}`,
                platformFee: `₦${platformFee.toLocaleString()}`,
                netRevenue: `₦${netRevenue.toLocaleString()}`,
                checkedInCount,
                attendanceRate,
                faceCheckIns: `${facePercent}%`,
                qrCheckIns: `${qrPercent}%`,
                manualCheckIns: `${manualPercent}%`,
                payoutLink: hasPendingWithdraw ? null : `${baseUrl}/partner/withdraw`,
                state: organizer.state || 'Nigeria',
                year: new Date().getFullYear(),
                unsubscribeUrl: `${baseUrl}/partner/preferences?unsub=email`,
                preferencesUrl: `${baseUrl}/partner/preferences`,
              },
              from: 'payouts@comfytag.com',
              replyTo: 'payouts@comfytag.com',
            }).catch(err => console.error('[Performance Report] Queue failed:', err.message));
          }
        }

        // ─── FLOW 3D: NEW EVENT ALERT (Follower Notification) ────────────────
        if (newStatus === 'published') {
          const followers = await Follow.find({ organizer_id: updatedEvent.planner_id }).lean();

          // Create real-time in-app notifications for followers
          const io = req.app.locals.io
          if (followers.length > 0) {
            // Use Promise.allSettled to emit all notifications in parallel (non-blocking)
            await Promise.allSettled(
              followers.map(f =>
                createNotification({
                  userId: f.follower_id.toString(),
                  type: 'new_event_from_following',
                  title: 'New Event',
                  message: `${updatedEvent.planner} just posted: ${updatedEvent.name}`,
                  data: {
                    event_id: updatedEvent._id,
                    eventName: updatedEvent.name,
                    organizerName: updatedEvent.planner,
                  },
                  io,
                }).catch(err => console.error('[Notification] New event alert failed:', err.message))
              )
            )
          }

          // Email followers
          if (followers.length > 0) {
            const remainingCapacity = (updatedEvent.ticketType?.reduce((sum, t) => sum + (t.capacity || 0), 0) || 100) - (updatedEvent.ticketType?.reduce((sum, t) => sum + (t.sold || 0), 0) || 0);
            const totalCapacity = updatedEvent.ticketType?.reduce((sum, t) => sum + (t.capacity || 0), 0) || 100;
            const capacityPercent = (remainingCapacity / totalCapacity) * 100;
            const isUrgent = capacityPercent < 20;

            const batchSize = 50;
            for (let i = 0; i < followers.length; i += batchSize) {
              const batch = followers.slice(i, i + batchSize);

              await Promise.allSettled(
                batch.map(async follower => {
                  // Re-query follower's user to check notification preference
                  const followerUser = await User.findById(follower.follower_id);
                  if (followerUser?.notificationPreferences?.email === false) {
                    return;
                  }

                  const ticketPrice = updatedEvent.ticketType?.length > 0 ? updatedEvent.ticketType[0].price : 0;

                  return enqueueEmail({
                    to: followerUser?.email,
                    subject: `${updatedEvent.planner} just dropped: ${updatedEvent.name}`,
                    template: 'newEventAlert.hbs',
                    data: {
                      firstName: (followerUser?.name || followerUser?.email).split(' ')[0],
                      organizerName: updatedEvent.planner,
                      eventName: updatedEvent.name,
                      eventDate: moment(updatedEvent.date).format('ddd, MMM D'),
                      eventTime: updatedEvent.startTime || 'TBA',
                      eventVenue: updatedEvent.venue || 'TBA',
                      ticketPrice: `₦${ticketPrice}`,
                      urgencyBadge: isUrgent,
                      remainingCapacity,
                      ticketLink: `${baseUrl}/events/${updatedEvent._id}`,
                      year: new Date().getFullYear(),
                      unsubscribeUrl: `${baseUrl}/preferences?unsub=email`,
                      preferencesUrl: `${baseUrl}/preferences`,
                    },
                    from: 'events@comfytag.com',
                  }).catch(err => console.error('[New Event Alert] Queue failed:', err.message));
                })
              );
            }

            console.log(`[New Event Alert] Queued ${followers.length} emails for followers`);
          }
        }

        res.status(200).json(updatedEvent)
    } catch (err) {
        next(err)
    }
}

// DELETE
export const deleteEvent = async (req, res, next) => {
    const userId = req.user.id || req.session?.user?.id;
    const eventId = req.params.id;

    if (!userId) return next(createError(401, 'User not authenticated'));

    try {
        // Verify user owns the event
        const event = await Event.findById(eventId);
        if (!event) return next(createError(404, 'Event not found'));
        if (event.planner_id.toString() !== userId.toString() && req.user.role !== 'admin') {
            return next(createError(403, 'You can only delete your own events'));
        }

        // Delete the event
        await Event.findByIdAndDelete(eventId);

        // Remove from user's event list (non-blocking)
        User.findByIdAndUpdate(userId, {
            $pull: { events: eventId },
        }).catch(err => {
            console.error('[Event Delete] Failed to update user events:', err.message);
        });

        // Emit Socket.io event for real-time event deletion
        const io = req.app.locals.io;
        if (io) {
            io.to(`organizer:${userId}`).emit('event:deleted', { eventId: eventId });
            console.log(`[Socket.io] Emitted event:deleted for organizer ${userId}, event ${eventId}`);
        }

        res.status(200).json({ success: true, message: 'Event has been deleted' });
    } catch (err) {
        next(err);
    }
}

// GET
export const getEvent = async (req, res, next) => {
    const { id } = req.params
    if (!id || id === 'undefined') return res.status(404).json({ success: false, message: 'Event not found' })
    try {
        let event = await Event.findOne({ slug: id })
        if (!event) {
            event = await Event.findById(id).catch(() => null)
        }
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' })
        res.status(200).json({ success: true, data: event })
    } catch (err) {
        next(err)
    }
}

// GET ALL
export const getAllEvents = async (req, res, next) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        else query.status = 'published';
        if (req.query.planner_id) query.planner_id = req.query.planner_id;
        if (req.query.state) query.state = req.query.state;
        if (req.query.category) query.category = req.query.category;

        // Handle past vs. upcoming events
        if (req.query.showPast === 'true') {
          query.date = { $lt: new Date() }
        } else {
          query.$or = [
            { date: { $exists: false } },
            { date: null },
            { date: { $gte: new Date() } }
          ]
        }

        if (req.query.priceMin || req.query.priceMax) {
          query['ticketType.price'] = {}
          if (req.query.priceMin) query['ticketType.price'].$gte = parseFloat(req.query.priceMin)
          if (req.query.priceMax) query['ticketType.price'].$lte = parseFloat(req.query.priceMax)
        }

        const page = Math.max(1, parseInt(req.query.page) || 1)
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20))
        const skip = (page - 1) * limit

        const [getEvents, total] = await Promise.all([
            Event.find(query).sort({ date: 1 }).skip(skip).limit(limit).lean(),
            Event.countDocuments(query),
        ])

        const normalized = getEvents.map(e => ({
          ...e,
          date: e.date ?? e.event_date ?? null
        }));
        res.status(200).json({ success: true, data: normalized, total, page, hasMore: skip + normalized.length < total });
    } catch (err) {
        next(err)
    }
}




// GET ALL
export const getPlannerEvents = async (req, res, next) => {
    try {
        const getUserEvents = await Event.find({ planner_id: req.params.userId })
        res.status(200).json(getUserEvents)
    } catch (err) {
        next(err)
    }
}

// GET
export const eventsBySingleFilter = async (req, res, next) => {
    const eventsfilter =  req.query.eventsfilter
    const filter = eventsfilter.toLowerCase()
    try {
        const singleFilter = await Event.find({$or :[
            {state: filter},{category: filter}, 
            {ticketType: filter}, {planner_id: filter}
        ]})
        res.status(200).json(singleFilter)
    } catch (err) {
        next(err)
    }
}

// GET
export const eventsByState = async (req, res, next) => {
    const eventstate =  req.query.eventstate
    try {
        const state = await Event.find({state:eventstate})
        res.status(200).json(state)
    } catch (err) {
        next(err)
    }
}

// GET
export const eventsByPick = async (req, res, next) => {
    try {
        const pick = await Event.find({pick: true})
        res.status(200).json(pick)
    } catch (err) {
        next(err)
    }
}

// GET
// Sort by number of sold tickets
export const eventsBySales = async (req, res, next) => {
    try {
        const sales = await Event.find({}).sort({'sold': -1})
        res.status(200).json(sales)
    } catch (err) {
        next(err)
    }
}


// GET /events/categories — distinct published event categories
export const getEventCategories = async (req, res, next) => {
    try {
        const categories = await Event.distinct('category', { status: 'published' })
        res.status(200).json({ success: true, data: categories.filter(Boolean).sort() })
    } catch (err) {
        next(err)
    }
}

// GET /events/states — distinct states that have published events
export const getEventStates = async (req, res, next) => {
    try {
        const states = await Event.distinct('state', { status: 'published' })
        res.status(200).json({ success: true, data: states.filter(Boolean).sort() })
    } catch (err) {
        next(err)
    }
}

// GET
export const eventsByFilter = async (req, res, next) => {
    if (!req.query.filterType) return res.status(200).json([])
    const filterType = req.query.filterType.split(",")
    try {
        const filter = await Promise.all(filterType.map(type=>{
            type.toLowerCase()
            return Event.find(
            type == "free" || type == "paid" ? {ticketType:type} : 
            type == "online" ||  type == "offline" ?  {location:type} :
            type == "today" ?  {$and: [{event_date:{$gt: moment(Date.now()).format("YYYY-MM-DDT00:00:00.000[Z]")}},  
                                            {event_date : {$lt: moment(Date.now()).format("YYYY-MM-DDT23:59:59.999[Z]")}}]} :
            type == "active" ?  {event_date:{$gt: moment(Date.now()).format("YYYY-MM-DDTHH:mm:ss.000[Z]")}} :
            type == "ended" ?  {event_date:{$lt: moment(Date.now()).format("YYYY-MM-DDTHH:mm:ss.999[Z]")}} :  req.query )

        }))
        res.status(200).json(filter)
    } catch (err) {
        next(err)
    }
}


// PUT /events/:id/tiers/:tierId
// Update a single ticket tier in-place
export const updateTicketTier = async (req, res, next) => {
    try {
        const { id: eventId, tierId } = req.params
        const { name, price, capacity } = req.body

        const event = await Event.findById(eventId)
        if (!event) return next(createError(404, 'Event not found'))

        const tierIndex = event.ticketType.findIndex(t => t._id.toString() === tierId)
        if (tierIndex === -1) return next(createError(404, 'Ticket tier not found'))

        // Update tier fields
        if (name !== undefined) event.ticketType[tierIndex].name = name
        if (price !== undefined) event.ticketType[tierIndex].price = price
        if (capacity !== undefined) event.ticketType[tierIndex].capacity = capacity

        const updated = await event.save()
        res.status(200).json({
            message: 'Ticket tier updated',
            tier: updated.ticketType[tierIndex],
        })
    } catch (err) {
        next(err)
    }
}

// DELETE /events/:id/tiers/:tierId
// Remove a single ticket tier
export const deleteTicketTier = async (req, res, next) => {
    try {
        const { id: eventId, tierId } = req.params

        const event = await Event.findById(eventId)
        if (!event) return next(createError(404, 'Event not found'))

        const tierIndex = event.ticketType.findIndex(t => t._id.toString() === tierId)
        if (tierIndex === -1) return next(createError(404, 'Ticket tier not found'))

        // Don't allow deletion if there are sold tickets in this tier
        const tierName = event.ticketType[tierIndex].name
        const soldsTickets = await Audience.findOne({ event_id: eventId, type: tierName, status: { $ne: 'refunded' } })
        if (soldsTickets) {
            return next(createError(400, 'Cannot delete tier with sold tickets'))
        }

        event.ticketType.splice(tierIndex, 1)
        await event.save()

        res.status(200).json({
            message: 'Ticket tier deleted',
        })
    } catch (err) {
        next(err)
    }
}

// GET /events/:id/tiers/stats
// Get per-tier sold/capacity breakdown
export const getTicketTierStats = async (req, res, next) => {
    try {
        const { id: eventId } = req.params

        const event = await Event.findById(eventId)
        if (!event) return next(createError(404, 'Event not found'))

        const tickets = await Audience.find({ event_id: eventId })

        const tierStats = event.ticketType.map(tier => {
            const tierTickets = tickets.filter(t => t.type === tier.name && t.status !== 'refunded')
            const sold = tierTickets.reduce((sum, t) => sum + t.numOfTicket, 0)
            return {
                _id: tier._id,
                name: tier.name,
                price: tier.price,
                capacity: tier.capacity,
                sold,
                available: tier.capacity - sold,
                soldPercentage: tier.capacity > 0 ? Math.round((sold / tier.capacity) * 100) : 0,
            }
        })

        res.status(200).json({
            eventId,
            tiers: tierStats,
        })
    } catch (err) {
        next(err)
    }
}

// GET Replace with eventByType
export const eventsByPayment = async (req, res, next) => {
    const paymentType = req.query.paymentType.split(",")
    // const eventLocation = req.query.paymentType.split(",")
    // const paymentAmount = paymentType === '' && 0
    try {
        const payment = await Promise.all(paymentType.map(paymentType=>{
            paymentType.toLowerCase()
            return Event.find(
            paymentType == "free" || paymentType == "paid" ? {ticketType:paymentType} : 
            paymentType == "online" ||  paymentType == "offline" ?  {location:paymentType} :
            paymentType == "today" ?  {$and: [{event_date:{$gt: moment(Date.now()).format("YYYY-MM-DDT00:00:00.000[Z]")}},  
                                            {event_date : {$lt: moment(Date.now()).format("YYYY-MM-DDT23:59:59.999[Z]")}}]} :
            paymentType == "active" ?  {event_date:{$gt: moment(Date.now()).format("YYYY-MM-DDT00:00:00.000[Z]")}} :
            paymentType == "ended" ?  {event_date:{$lt: moment(Date.now()).format("YYYY-MM-DDT00:00:00.000[Z]")}} :  req.query )
            // return Event.find(paymentType === '' || paymentType === 'all' ? req.query : {ticketType:paymentType})
        }))
        //  await Event.find({ticketType:paymentType})
        res.status(200).json(payment)
    } catch (err) {
        next(err)
    }
}

// GET ALL
export const eventsByCategory = async (req, res, next) => {
    const categories = req.query.categories.split(",")
    try {
        const list = await Promise.all(categories.map(category=>{
            return Event.find(
                category == "" || category == "all" ?  req.query : {category:category})
        }))
        res.status(200).json(list)
    } catch (err) {
        next(err)
    }
}

// GET /events/feed
// Personalised event feed for logged-in attendee
// Prioritises: followed organizers > location > trending
export const getEventFeed = async (req, res, next) => {
  try {
    const { state, limit = 20, page = 1 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const query = {
      status: 'published',
      'ticketType.0': { $exists: true },
    }

    // Filter by state/location if provided
    if (state) query.state = state

    const events = await Event.find(query)
      .sort({ date: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Event.countDocuments(query)

    res.status(200).json({
      events,
      total,
      page: parseInt(page),
      hasMore: skip + events.length < total,
    })
  } catch (err) {
    next(err)
  }
}

// GET /events/nearby
// Events filtered by Nigerian state
export const getEventsByState = async (req, res, next) => {
  try {
    const { state, limit = 20, page = 1 } = req.query
    if (!state) {
      return next(createError(400, 'state parameter is required'))
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const events = await Event.find({
      status: 'published',
      state: { $regex: state, $options: 'i' },
    })
      .sort({ date: 1 })
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Event.countDocuments({
      status: 'published',
      state: { $regex: state, $options: 'i' },
    })

    res.status(200).json({
      events,
      total,
      page: parseInt(page),
      hasMore: skip + events.length < total,
      state,
    })
  } catch (err) {
    next(err)
  }
}

