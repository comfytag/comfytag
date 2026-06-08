import express from 'express'
import { createAudience, createFreeAudience, deleteAudience, getAllAudience, getAudience, getAudienceByReference, getEventAudience, getUserAudience, getMyTickets, updateAudience, manualCheckIn, exportEventAudienceCSV, checkInByReference } from '../controllers/audience.js';
import { verifyAdmin, verifyUser, verifyToken } from '../utils/verifyToken.js';

const router = express.Router()

// Free ticket claim — no auth required
router.post("/free/:eventId", createFreeAudience)

// POST QR/barcode scanner check-in by reference string (before /:userId/:eventId wildcard)
router.post("/checkin-by-ref", verifyUser, checkInByReference)

// POST manual check-in toggle (before /:userId/:eventId wildcard)
router.post("/:id/checkin", verifyUser, manualCheckIn)

// Ticket purchase (must come after routes with static segments)
router.post("/:userId/:eventId", verifyToken, createAudience)

// GET /audience/my — user's tickets with event enrichment (static route before wildcard)
router.get("/my", verifyToken, getMyTickets)

// GET ALL BY A PLANNER (static routes before wildcard)
router.get("/user/:userId", verifyToken, getUserAudience)

// GET ALL BY A Event
router.get("/event/:eventId", verifyToken, getEventAudience)

// CSV EXPORT for event attendees
router.get("/events/:eventId/audience/export", verifyUser, exportEventAudienceCSV)

// GET BY REFERENCE — public ticket preview for claim-ticket page
router.get("/ref/:reference", getAudienceByReference)

// UPDATE
router.put("/:id", verifyUser, updateAudience)
// DELETE
router.delete("/:id/:userId", verifyAdmin, deleteAudience)
// GET
router.get("/:id", verifyUser, getAudience)
// GET ALL
router.get("/", verifyUser, getAllAudience)



export default router