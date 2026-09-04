import express from 'express'
import rateLimit from 'express-rate-limit'
// import {  adminlogin, login, register } from '../controllers/auth.js'
import { register, login, googleSignIn, verifyEmail, verifyEmailOTP, requestLoginOtp, verifyID, sendVerifyEmail, registerAsOrganizer, getMe, forgotPassword, verifyOtp, resetPassword, changePassword } from '../controllers/auth.js'
import { verifyUser, verifyAdmin, verifyToken } from '../utils/verifyToken.js'
// import { login } from '../controllers/users.js'

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
})

// Phase 12B: a 6-digit OTP has only 1,000,000 possibilities — the shared
// 10-per-15-minutes authLimiter above is generous enough to make guessing
// impractical only if it's actually applied everywhere an OTP is checked.
// This dedicated, stricter limiter covers both OTP-verification endpoints;
// its message deliberately says nothing about whether the identifier/email
// exists, matching the generic wording already used elsewhere in this file.
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
})

// Phase 12B: reset-password is the step that actually spends a short-lived
// (5 minute) reset JWT — rate-limited so a stolen/guessed token can't be
// hammered with password variations for the rest of its validity window.
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
})

// Phase 12B: registration had no rate limit at all — unlimited automated
// account creation from a single IP. Loose enough (30/hour) not to block a
// legitimate shared-IP burst (e.g. an office or campus network signing up
// for an event together).
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many accounts created from this network. Please try again later.' },
})

// CREATE
router.post("/register", registerLimiter, register)
router.post("/register-partner", registerLimiter, (req, res, next) => {
  req.body.isPartner = true
  register(req, res, next)
})
router.post("/login", authLimiter, login)
router.post("/google-signin", googleSignIn)
router.get("/me", verifyToken, getMe)
router.get("/:id/verify/:token/", verifyEmail)
router.put("/:id/verifykyc/:kyc/", verifyAdmin, verifyID)
router.post("/resend-verification", authLimiter, sendVerifyEmail)
router.get("/verify/:email/", verifyUser, sendVerifyEmail)
router.put('/register-organizer/:userId', verifyUser, registerAsOrganizer)

// Email verification OTP — also serves as passwordless login (see
// verifyEmailOTP: issues a real session on success, not just a verified flag)
router.post("/verify-email-otp", otpVerifyLimiter, verifyEmailOTP)
router.post("/request-otp", authLimiter, requestLoginOtp)

// Password Reset Routes
router.post("/forgot-password", authLimiter, forgotPassword)
router.post("/verify-otp", otpVerifyLimiter, verifyOtp)
router.post("/reset-password", passwordResetLimiter, resetPassword)
router.post("/change-password", verifyUser, changePassword)

export default router