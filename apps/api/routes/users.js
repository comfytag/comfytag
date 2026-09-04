import express from 'express'
import { deleteUser, getAllUsers, getUser, getUserStats, isUserVerified, onboardUser, updateUser, userVerification, uploadKYC } from '../controllers/users.js'
// import { verifyAdmin } from '../utils/admin/verifyToken.js'
import { verifyUser, verifyAdmin, verifyToken, optionalAuth  } from '../utils/verifyToken.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()



// ONBOARD USER
router.put("/onboard/:id", verifyUser, onboardUser)


// UPDATE
router.put("/:id", verifyUser, updateUser)
router.patch("/:id", verifyUser, updateUser)

router.put("/verify/:id", verifyUser, userVerification) // verifyUser,

router.put("/isverify/:id", verifyAdmin, isUserVerified)

// KYC upload — selfie + ID document submitted together
router.put("/:id/kyc", verifyUser, upload.fields([{ name: 'selfie', maxCount: 1 }, { name: 'idDocument', maxCount: 1 }]), uploadKYC)

// GET stats (must come before /:id route)
router.get("/:id/stats", getUserStats)

// DELETE
router.delete("/:id", verifyUser, deleteUser) //  verifyUser,
// GET - Public endpoint for user profile (no auth required to view someone
// else's profile; optionalAuth decodes a token if present so getUser can
// tell the owner viewing their own profile apart from everyone else and
// include the additional self-only fields the web/partner/mobile settings
// screens need — see getUser's own doc comment).
router.get("/:id", optionalAuth, getUser)

// GET ALL
router.get("/", verifyAdmin, getAllUsers)


// GET ADMIN
// router.get("/admin", verifyAdmin, getAdmin)
export default router