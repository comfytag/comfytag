import express from 'express'
import rateLimit from 'express-rate-limit'
// import {  adminlogin, login, register } from '../controllers/auth.js'
import { register, login, googleSignIn, verifyEmail, verifyID, sendVerifyEmail, registerAsOrganizer, getMe, forgotPassword, verifyOtp, resetPassword, changePassword } from '../controllers/auth.js'
import { verifyUser, verifyAdmin } from '../utils/verifyToken.js'
// import { login } from '../controllers/users.js'

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
})

// CREATE
router.post("/register", register)
router.post("/register-partner", (req, res, next) => {
  req.body.isPartner = true
  register(req, res, next)
})
router.post("/login", authLimiter, login)
router.post("/google-signin", googleSignIn)
router.get("/me", verifyUser, getMe)
router.get("/:id/verify/:token/", verifyEmail)
router.put("/:id/verifykyc/:kyc/", verifyAdmin, verifyID)
router.get("/verify/:email/", verifyUser, sendVerifyEmail)
router.put('/register-organizer/:userId', verifyUser, registerAsOrganizer)

// Password Reset Routes
router.post("/forgot-password", authLimiter, forgotPassword)
router.post("/verify-otp", authLimiter, verifyOtp)
router.post("/reset-password", resetPassword)
router.post("/change-password", verifyUser, changePassword)

export default router