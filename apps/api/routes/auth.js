import express from 'express'
// import {  adminlogin, login, register } from '../controllers/auth.js'
import { register, login, googleSignIn, verifyEmail, verifyID, sendVerifyEmail, registerAsOrganizer, getMe, forgotPassword, verifyOtp, resetPassword, changePassword } from '../controllers/auth.js'
import { verifyUser, verifyAdmin } from '../utils/verifyToken.js'
// import { login } from '../controllers/users.js'

const router = express.Router()


// CREATE
router.post("/register", register)
router.post("/login", login)
router.post("/google-signin", googleSignIn)
router.get("/me", verifyUser, getMe)
router.get("/:id/verify/:token/", verifyEmail)
router.put("/:id/verifykyc/:kyc/", verifyAdmin, verifyID)
router.get("/verify/:email/", verifyUser, sendVerifyEmail)
router.put('/register-organizer/:userId', verifyUser, registerAsOrganizer)

// Password Reset Routes
router.post("/forgot-password", forgotPassword)
router.post("/verify-otp", verifyOtp)
router.post("/reset-password", resetPassword)
router.post("/change-password", verifyUser, changePassword)

export default router