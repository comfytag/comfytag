import express from 'express'
import {
  registerPushToken,
  deregisterPushToken,
} from '../controllers/pushToken.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

// NOTE: these routes have no `:id`-shaped param, so verifyUser's self-match
// silently degrades to admin-only (same class of bug already fixed on
// event.js's `/:id/activity` route). Both controllers already self-scope
// every write to req.user.id, so verifyToken (auth only) is correct here.
router.post('/', verifyToken, registerPushToken)
router.delete('/', verifyToken, deregisterPushToken)

export default router
