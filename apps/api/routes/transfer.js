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

router.post('/initiate', verifyUser, initiateTransfer)
router.post('/accept', verifyUser, acceptTransfer)
router.post('/decline', verifyUser, declineTransfer)
router.post('/claim', verifyToken, claimTicket)
router.get('/incoming', verifyUser, getIncomingTransfers)

export default router
