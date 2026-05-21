import express from 'express'
import {
  registerPushToken,
  deregisterPushToken,
} from '../controllers/pushToken.js'
import { verifyUser } from '../utils/verifyToken.js'

const router = express.Router()

router.post('/', verifyUser, registerPushToken)
router.delete('/', verifyUser, deregisterPushToken)

export default router
