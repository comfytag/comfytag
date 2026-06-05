import express from 'express'
import {
  initiateTransfer,
  acceptTransfer,
  declineTransfer,
  claimTicket,
  getIncomingTransfers,
} from '../controllers/transfer.js'
import { verifyToken, verifyUser } from '../utils/verifyToken.js'

const router = express.Router()

router.post('/initiate', verifyToken, initiateTransfer)
router.post('/accept', verifyToken, acceptTransfer)
router.post('/decline', verifyToken, declineTransfer)
router.post('/claim', verifyToken, claimTicket)
router.get('/incoming', verifyToken, getIncomingTransfers)

export default router
