import express from 'express'
// import { createCategory } from '../controllers/category.js'
import { deleteCategory, getAllCategories, getCategory, updateCategory, createCategory } from '../controllers/category.js'
import { verifyUser, verifyAdmin  } from '../utils/verifyToken.js'

const router = express.Router()



// CREATE
router.post("/", verifyAdmin, createCategory)

// UPDATE
router.put("/:id", verifyAdmin, updateCategory)

// DELETE
router.delete("/:id", verifyAdmin, deleteCategory)

// GET
router.get("/:id", getCategory)

// GET ALL
router.get("/", getAllCategories)
export default router