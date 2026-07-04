import express from 'express'
import { createEvent, deleteEvent, eventsByCategory, eventsByPayment, eventsByState, getAllEvents, getEvent, getPlannerEvents, updateEvent, eventsByPick, eventsBySales, eventsByFilter, eventsBySingleFilter, getEventFeed, getEventsByState, updateTicketTier, deleteTicketTier, getTicketTierStats, getEventCategories, getEventStates, publishEvent, cancelEvent, getCategoryCounts, getEventActivity } from '../controllers/event.js';
import { verifyAdmin, verifyUser, verifyToken } from '../utils/verifyToken.js';

const router = express.Router()


// // CREATE
// router.post("/:userId", verifyUser, createEvent)
// // UPDATE
// router.put("/:id", verifyUser, updateEvent)
// // DELETE
// router.delete("/:id/:userId", verifyAdmin, deleteEvent)



// Static GET routes (must be before /:id wildcard)
router.get("/feed", getEventFeed)
router.get("/nearby", getEventsByState)
router.get("/categories", getEventCategories)
router.get("/category-counts", getCategoryCounts)
router.get("/states", getEventStates)
router.get("/category/byCategory", eventsByCategory)
router.get("/filter/byType", eventsByFilter)
router.get("/filter/single", eventsBySingleFilter)
router.get("/pick/toppick", eventsByPick)
router.get("/pick/sold", eventsBySales)
router.get("/state/byState", eventsByState)
router.get("/payment/byPayment", eventsByPayment)
router.get("/user/:userId", getPlannerEvents)

// POST must come after static routes to avoid conflicts
router.post("/:userId", verifyUser, createEvent)

// Live activity feed
// NOTE: these routes take an event id in `:id`, not the caller's user id —
// verifyUser's param-matching check would always fail for legitimate owners
// (event id never equals user id), so it 403'd every non-admin request
// regardless of ownership. Each controller below does its own ownership
// check against event.planner_id, so verifyToken (auth only) is correct here.
router.get("/:id/activity", verifyToken, getEventActivity)

// Ticket tier management
router.get("/:id/tiers/stats", getTicketTierStats)
router.put("/:id/tiers/:tierId", verifyToken, updateTicketTier)
router.delete("/:id/tiers/:tierId", verifyToken, deleteTicketTier)

// Event status transitions (explicit state machine)
router.post("/:id/publish", verifyToken, publishEvent)
router.post("/:id/cancel", verifyToken, cancelEvent)

// Dynamic routes
// UPDATE
router.put("/:id", verifyToken, updateEvent)
// PATCH (partial update — used by cancel, status changes)
router.patch("/:id", verifyToken, updateEvent)
// DELETE (allow event creator to delete their own event)
router.delete("/:id", verifyToken, deleteEvent)
// GET single event
router.get("/:id", getEvent)
// GET ALL
router.get("/", getAllEvents)



export default router