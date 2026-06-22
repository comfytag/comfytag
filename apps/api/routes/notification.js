import express from 'express'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.js'
import { verifyToken } from '../utils/verifyToken.js'

const router = express.Router()

router.get('/', verifyToken, getNotifications)
router.put('/read-all', verifyToken, markAllAsRead)
router.put('/:id/read', verifyToken, markAsRead)

export default router
