import express from 'express'
import { deleteUser, getAllUsers, getUser, isUserVerified, onboardUser, updateUser, userVerification, uploadKYC } from '../controllers/users.js'
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

// DELETE
router.delete("/:id", verifyUser, deleteUser) //  verifyUser,
// GET
router.get("/:id", verifyUser,  getUser) // verifyUser,
// router.get("/:id", getUser)

// GET ALL
router.get("/", verifyAdmin, getAllUsers)


// GET ADMIN
// router.get("/admin", verifyAdmin, getAdmin)
export default router