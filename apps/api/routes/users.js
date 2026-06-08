import express from 'express'
import { deleteUser, getAllUsers, getUser, getUserStats, isUserVerified, onboardUser, updateUser, userVerification, uploadKYC } from '../controllers/users.js'
// import { verifyAdmin } from '../utils/admin/verifyToken.js'
import { verifyUser, verifyAdmin, verifyToken  } from '../utils/verifyToken.js'

const router = express.Router()



// ONBOARD USER
router.put("/onboard/:id", verifyUser, onboardUser)


// UPDATE
router.put("/:id", verifyUser, updateUser)
router.patch("/:id", verifyUser, updateUser)

router.put("/verify/:id", verifyUser, userVerification) // verifyUser,

router.put("/isverify/:id", verifyAdmin, isUserVerified)

// KYC upload
router.put("/:id/kyc", verifyUser, uploadKYC)

// GET stats (must come before /:id route)
router.get("/:id/stats", getUserStats)

// DELETE
router.delete("/:id", verifyUser, deleteUser) //  verifyUser,
// GET - Public endpoint for user profile (no auth required)
router.get("/:id", getUser)

// GET ALL
router.get("/", verifyAdmin, getAllUsers)


// GET ADMIN
// router.get("/admin", verifyAdmin, getAdmin)
export default router