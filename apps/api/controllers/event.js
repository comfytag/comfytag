
import moment from 'moment/moment.js';
import Event from '../models/Event.js'
import User from '../models/User.js';
import Follow from '../models/Follow.js'
import Notification from '../models/Notification.js'
import Audience from '../models/Audience.js'
import { createError } from '../utils/error.js'

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
        
        //  Add new event and fetch plannerId and planner name
    const newEvent = new Event({
        ...req.body,
         planner_id: userId,
         planner: username,
         slug: toSlug(req.body.name) + '-' + Date.now().toString(36),
     });
    try {
        const savedEvent = await newEvent.save()
        // Push eventId to user evet list
        try {
            await User.findByIdAndUpdate(userId, {
                 $push: { events: savedEvent._id },
                 });
        } catch (err) {
            next(err)
        }
        res.status(200).json(savedEvent)
        console.log(savedEvent)
    } catch (err) {
        next(err)
    }
}

// UPDATE
export const updateEvent = async (req, res, next) => {

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        )

        // Notify all followers when an event is published
        if (req.body.status === 'published') {
            const followers = await Follow.find({ organizer_id: updatedEvent.planner_id })
            if (followers.length > 0) {
                const notifications = followers.map(f => ({
                    user_id: f.follower_id,
                    type: 'new_event_from_following',
                    title: 'New Event',
                    message: `${updatedEvent.planner} just posted a new event: ${updatedEvent.name}`,
                    data: { event_id: updatedEvent._id }
                }))
                await Notification.insertMany(notifications)
            }
        }

        res.status(200).json(updatedEvent)
    } catch (err) {
        next(err)
    }
}

// DELETE
export const deleteEvent = async (req, res, next) => {
    const userId = req.params.userId;
    try {
        await Event.findByIdAndDelete(
            req.params.id
        )
        try {
            await User.findByIdAndUpdate(userId, {
                 $pull: { events: req.params.id },
                 });
        } catch (err) {
            next(err)
        }
        res.status(200).json('Event has been deleted')
    } catch (err) {
        next(err)
    }
}

// GET
export const getEvent = async (req, res, next) => {
    const { id } = req.params
    if (!id || id === 'undefined') return res.status(404).json({ message: 'Event not found' })
    try {
        let event = await Event.findOne({ slug: id })
        if (!event) {
            event = await Event.findById(id).catch(() => null)
        }
        if (!event) return res.status(404).json({ message: 'Event not found' })
        res.status(200).json(event)
    } catch (err) {
        next(err)
    }
}

// GET ALL
export const getAllEvents = async (req, res, next) => {
    const date_time = new Date();
    // const { startDate, endDate } = req.query;
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.planner_id) query.planner_id = req.query.planner_id;
        if (req.query.state) query.state = req.query.state;
        if (req.query.category) query.category = req.query.category;
        const getEvents = await Event.find(query)
        // const getEvents = await Event.find( { 
        //         ticket_end: {
        //           $gte: date_time,
        //         //   $lt: date_time
        //         }, 
        //   })
        res.status(200).json(getEvents)
        console.log(getEvents.ticket_end, date_time)
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


// GET
export const eventsByFilter = async (req, res, next) => {
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

