import express from 'express'
import {
  enrollFace,
  verifyFace,
  removeFace
} from '../controllers/face.js'
import { verifyUser } from '../utils/verifyToken.js'

const router = express.Router()

router.post('/enroll/:userId', verifyUser, enrollFace)
router.post('/verify', verifyUser, verifyFace)
router.delete('/remove/:userId', verifyUser, removeFace)

export default router
