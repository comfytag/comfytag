import express from 'express'
import { createAudience, createFreeAudience, deleteAudience, getAllAudience, getAudience, getAudienceByReference, getEventAudience, getUserAudience, getMyTickets, updateAudience, manualCheckIn, exportEventAudienceCSV, checkInByReference } from '../controllers/audience.js';
import { verifyAdmin, verifyUser, verifyToken, verifyPartner } from '../utils/verifyToken.js';

const router = express.Router()

// Free ticket claim — no auth required
router.post("/free/:eventId", createFreeAudience)

// POST QR/barcode scanner check-in by reference string (before /:userId/:eventId wildcard)
router.post("/checkin-by-ref", verifyPartner, checkInByReference)

// POST manual check-in toggle (before /:userId/:eventId wildcard)
router.post("/:id/checkin", verifyPartner, manualCheckIn)

// Ticket purchase (must come after routes with static segments)
router.post("/:userId/:eventId", verifyToken, createAudience)

// GET /audience/my — user's tickets with event enrichment (static route before wildcard)
router.get("/my", verifyToken, getMyTickets)

// GET ALL BY A PLANNER (static routes before wildcard)
router.get("/user/:userId", verifyToken, getUserAudience)

// GET ALL BY A Event
router.get("/event/:eventId", verifyPartner, getEventAudience)

// CSV EXPORT for event attendees
router.get("/events/:eventId/audience/export", verifyPartner, exportEventAudienceCSV)

// GET BY REFERENCE — public ticket preview for claim-ticket page
router.get("/ref/:reference", getAudienceByReference)

// UPDATE — partner must own the event (enforced in controller)
router.put("/:id", verifyPartner, updateAudience)
// DELETE — ownership enforced in controller (self, partner, or admin)
router.delete("/:id/:userId", verifyToken, deleteAudience)
// GET — self or admin (enforced in controller)
router.get("/:id", verifyToken, getAudience)
// GET ALL — admin only
router.get("/", verifyAdmin, getAllAudience)



export default router