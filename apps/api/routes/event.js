import express from 'express'
import { createEvent, deleteEvent, eventsByCategory, eventsByPayment, eventsByState, getAllEvents, getEvent, getPlannerEvents, updateEvent, eventsByPick, eventsBySales, eventsByFilter, eventsBySingleFilter, getEventFeed, getEventsByState, updateTicketTier, deleteTicketTier, getTicketTierStats } from '../controllers/event.js';
import { verifyAdmin, verifyUser, verifyToken } from '../utils/verifyToken.js';

const router = express.Router()


// // CREATE
// router.post("/:userId", verifyUser, createEvent)
// // UPDATE
// router.put("/:id", verifyUser, updateEvent)
// // DELETE
// router.delete("/:id/:userId", verifyAdmin, deleteEvent)



router.post("/:userId", verifyToken, createEvent)

// Static GET routes (must be before /:id wildcard)
router.get("/feed", getEventFeed)
router.get("/nearby", getEventsByState)
router.get("/category/byCategory", eventsByCategory)
router.get("/filter/byType", eventsByFilter)
router.get("/filter/single", eventsBySingleFilter)
router.get("/pick/toppick", eventsByPick)
router.get("/pick/sold", eventsBySales)
router.get("/state/byState", eventsByState)
router.get("/payment/byPayment", eventsByPayment)
router.get("/user/:userId", getPlannerEvents)

// Ticket tier management
router.get("/:id/tiers/stats", getTicketTierStats)
router.put("/:id/tiers/:tierId", verifyToken, updateTicketTier)
router.delete("/:id/tiers/:tierId", verifyToken, deleteTicketTier)

// Dynamic routes
// UPDATE
router.put("/:id", verifyUser, updateEvent)
// PATCH (partial update — used by cancel, status changes)
router.patch("/:id", verifyUser, updateEvent)
// DELETE (allow event creator to delete their own event)
router.delete("/:id", verifyUser, deleteEvent)
// GET single event
router.get("/:id", getEvent)
// GET ALL
router.get("/", getAllEvents)



export default router