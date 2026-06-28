import express from 'express'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  subscribePush,
  unsubscribePush,
} from '../controllers/notification.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

router.get('/', verifyToken, getNotifications)
router.put('/read-all', verifyToken, markAllAsRead)
router.put('/:id/read', verifyToken, markAsRead)

// Web Push subscription management
router.post('/web-push/subscribe', verifyToken, subscribePush)
router.delete('/web-push/unsubscribe', verifyToken, unsubscribePush)

export default router
