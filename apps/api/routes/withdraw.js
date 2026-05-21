import express from 'express'
import { createBank, createWithdraw, deleteBank, deleteWithdraw, getAllBanks, getAllWithdraws, getBank, getUserWithdraw, getWithdraw, updateBank, updateBankStatus, updateWithdraw } from '../controllers/bank.js'
// import { verifyAdmin } from '../utils/admin/verifyToken.js'
import { verifyUser, verifyAdmin  } from '../utils/verifyToken.js'

const router = express.Router()



router.post("/:userId", verifyUser, createWithdraw)
// UPDATE
router.put("/edit/:id", verifyUser,  updateWithdraw)
// DELETE
router.delete("/:id", verifyUser, deleteWithdraw)
// GET
router.get("/show/:id", verifyUser, getWithdraw)

// Get User Withdraws
router.get("/:userId", verifyUser, getUserWithdraw)
// router.get("/:id", getBank)

// GET ALL
router.get("/", verifyAdmin, getAllWithdraws)


export default router