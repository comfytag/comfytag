import express from 'express'
import { createBank, deleteBank, getAllBanks, getBank, getBankList, updateBank, updateBankStatus } from '../controllers/bank.js'
// import { verifyAdmin } from '../utils/admin/verifyToken.js'
import { verifyUser, verifyAdmin, verifyToken } from '../utils/verifyToken.js'

const router = express.Router()



router.post("/:userId", verifyUser, createBank)
// UPDATE
// NOTE: `:id` here is the bank record's id, not the caller's user id, so
// verifyUser's self-match would always fail for legitimate owners (same
// class of bug already fixed on the DELETE route below). Ownership is
// enforced controller-side against bank.user_id instead.
router.put("/edit/:id", verifyToken, updateBank)
// DELETE
// NOTE: `:id` here is the bank record's id, not the caller's user id, so
// verifyUser's self-match would always fail for legitimate owners (same
// class of bug already fixed on event.js's `/:id/activity` route). Ownership
// is enforced controller-side against bank.user_id instead.
router.delete("/:id", verifyToken, deleteBank)

// Reference list of Nigerian banks (name + Paystack bank code) for the
// add-bank-account dropdown. Must be declared before GET /:userId so Express
// doesn't swallow "list" as a :userId param.
router.get("/list", getBankList)

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