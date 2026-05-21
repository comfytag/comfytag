import express from 'express'
import { createAudience, createFreeAudience, deleteAudience, getAllAudience, getAudience, getAudienceByReference, getEventAudience, getUserAudience, updateAudience, manualCheckIn, exportEventAudienceCSV } from '../controllers/audience.js';
import { verifyAdmin, verifyUser, verifyToken } from '../utils/verifyToken.js';

const router = express.Router()

// Free ticket claim — no auth required
router.post("/free/:eventId", createFreeAudience)

router.post("/:userId/:eventId", verifyToken, createAudience)

// GET ALL BY A PLANNER (static routes before wildcard)
router.get("/user/:userId", verifyUser, getUserAudience)

// GET ALL BY A Event
router.get("/event/:eventId", verifyToken, getEventAudience)

// CSV EXPORT for event attendees
router.get("/events/:eventId/audience/export", verifyUser, exportEventAudienceCSV)

// GET BY REFERENCE — public ticket preview for claim-ticket page
router.get("/ref/:reference", getAudienceByReference)

// POST manual check-in toggle
router.post("/:id/checkin", verifyUser, manualCheckIn)

// UPDATE
router.put("/:id", verifyUser, updateAudience)
// DELETE
router.delete("/:id/:userId", verifyAdmin, deleteAudience)
// GET
router.get("/:id", verifyUser, getAudience)
// GET ALL
router.get("/", verifyUser, getAllAudience)



export default router