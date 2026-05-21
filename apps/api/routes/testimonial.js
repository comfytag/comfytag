import express from 'express'
import { deleteTestimonial, getAllTestimonials, getTestimonial, createTestimonial } from '../controllers/testimonial.js'
import { verifyAdmin  } from '../utils/verifyToken.js'

const router = express.Router()



// CREATE
router.post("/", verifyAdmin, createTestimonial)

// DELETE
router.delete("/:id", verifyAdmin, deleteTestimonial)

// GET
router.get("/:id", getTestimonial)

// GET ALL
router.get("/", getAllTestimonials)
export default router