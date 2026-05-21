import express from 'express'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.js'
import { verifyUser } from '../utils/verifyToken.js'

const router = express.Router()

router.get('/', verifyUser, getNotifications)
router.put('/read-all', verifyUser, markAllAsRead)
router.put('/:id/read', verifyUser, markAsRead)

export default router
