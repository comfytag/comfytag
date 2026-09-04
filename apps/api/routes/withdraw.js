import express from 'express'
import { createBank, createWithdraw, deleteBank, deleteWithdraw, getAllBanks, getAllWithdraws, getBank, getUserWithdraw, getWithdraw, updateBank, updateBankStatus, updateWithdraw } from '../controllers/bank.js'
// import { verifyAdmin } from '../utils/admin/verifyToken.js'
import { verifyUser, verifyAdmin, verifyToken  } from '../utils/verifyToken.js'
import { verifyAdminRole } from '../utils/verifyAdminRole.js'

const router = express.Router()



router.post("/:userId", verifyUser, createWithdraw)
// UPDATE — finance-admin only (approve/reject). Previously `verifyUser`,
// which combined with `bank.js#updateWithdraw`'s old unrestricted
// `$set: req.body` let ANY authenticated caller approve/reject/rewrite any
// payout. See discussion/security for the incident this closes.
router.put("/edit/:id", verifyAdminRole(['finance']), updateWithdraw)
// DELETE — `:id` here is the Withdraw document id, not the caller's own user
// id, so `verifyUser`'s self-check (`userId === params.id`) would reject the
// real owner too; use plain `verifyToken` (authenticate only) and let
// `deleteWithdraw` enforce ownership itself, same as updateBank/deleteBank.
router.delete("/:id", verifyToken, deleteWithdraw)
// GET — `:id` here is the Withdraw record's id, not the caller's user id
// (same reasoning as the DELETE route above); getWithdraw now enforces
// ownership itself against withdraw.user_id.
router.get("/show/:id", verifyToken, getWithdraw)

// Get User Withdraws
router.get("/:userId", verifyUser, getUserWithdraw)
// router.get("/:id", getBank)

// GET ALL
router.get("/", verifyAdmin, getAllWithdraws)


export default router