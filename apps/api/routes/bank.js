import express from 'express'
import { createBank, deleteBank, getAllBanks, getBank, updateBank, updateBankStatus } from '../controllers/bank.js'
// import { verifyAdmin } from '../utils/admin/verifyToken.js'
import { verifyUser, verifyAdmin  } from '../utils/verifyToken.js'

const router = express.Router()



router.post("/:userId", verifyUser, createBank)
// UPDATE
router.put("/edit/:id", verifyUser,  updateBank)
// DELETE
router.delete("/:id", verifyUser, deleteBank) //, verifyUser
// GET
router.get("/:userId", verifyUser, getBank)
// router.get("/:id", getBank)

// GET ALL
router.get("/", verifyAdmin, getAllBanks)



// UPDATE
router.put("/:userId/:bankId", verifyUser, updateBankStatus)

// GET ADMIN
// router.get("/admin", verifyAdmin, getAdmin)
export default router