// import {Bank, Withdraw} from '../models/Bank.js'
import Bank from '../models/Bank.js';
import Withdraw from '../models/Withdraw.js';
import User from '../models/User.js';
import { createNotification, notifyAdmins } from './notification.js';
import { createError } from '../utils/error.js';
import { computeAvailableBalance } from './analytics.js';


// CREATE Bank

export const createBank = async (req, res, next) => {
    const userId = req.params.userId;
    const acctName =   await User.findById(userId)

    const newBank = new Bank({
        ...req.body,
        user_id: userId,
        acctName: acctName.name,
        isActive: true,
     });
    try {
        const savedBank = await newBank.save()
      
        res.status(200).json(savedBank)
    } catch (err) {
        next(err)
    }
}

// UPDATE
export const updateBank = async (req, res, next) => {
    try {
        const bank = await Bank.findById(req.params.id)
        if (!bank) return next(createError(404, 'Bank record not found'))

        const requesterId = (req.user._id ?? req.user.id ?? '').toString()
        if (bank.user_id.toString() !== requesterId && !req.user.isAdmin) {
            return next(createError(403, 'You are not authorized!'))
        }

        // Strict whitelist — only bank detail fields; never user_id, status, or flags
        const updateData = {}
        if ('bankName' in req.body) updateData.bankName = req.body.bankName
        if ('acctName' in req.body) updateData.acctName = req.body.acctName
        if ('acctNumber' in req.body) updateData.acctNumber = req.body.acctNumber
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update. Allowed: bankName, acctName, acctNumber.' })
        }

        const updatedBank = await Bank.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        )
        res.status(200).json(updatedBank)
    } catch (err) {
        next(err)
    }
}


// DELETE
export const deleteBank = async (req, res, next) => {
    try {
        const bank = await Bank.findById(req.params.id)
        if (!bank) return next(createError(404, 'Bank record not found'))

        const requesterId = (req.user._id ?? req.user.id ?? '').toString()
        if (bank.user_id.toString() !== requesterId && !req.user.isAdmin) {
            return next(createError(403, 'You are not authorized!'))
        }

        await Bank.findByIdAndDelete(req.params.id)
        res.status(200).json('Bank has been deleted')
    } catch (err) {
        next(err)
    }
}

// GET
export const getBank = async (req,res,next) =>{
    try{
        const getBank = await Bank.find({user_id: req.params.userId})
            res.status(200).json(getBank)
    }catch(err){
        next(err)
    }
}

// GET ALL
export const getAllBanks = async (req,res,next) =>{

    try{
        const getBanks = await Bank.find()
        res.status(200).json(getBanks)
    }catch(err){
        next(err)
    }
}

// UPDATE (isActive toggle only — used to mark a bank account as the active payout target)
export const updateBankStatus = async (req, res, next) => {
    try {
        const bank = await Bank.findById(req.params.bankId)
        if (!bank) return next(createError(404, 'Bank record not found'))

        const requesterId = (req.user._id ?? req.user.id ?? '').toString()
        if (bank.user_id.toString() !== requesterId && !req.user.isAdmin) {
            return next(createError(403, 'You are not authorized!'))
        }

        if (typeof req.body.isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'isActive (boolean) is required' })
        }

        const updateStatus = await Bank.findByIdAndUpdate(
            req.params.bankId,
            { $set: { isActive: req.body.isActive } },
            { new: true }
        )
        res.status(200).json(updateStatus)
    } catch (err) {
        next(err)
    }
}






// Withdrawal

// CREATE Withdraw
export const createWithdraw = async (req, res, next) => {
    // Hardcode user_id from the verified JWT — never trust req.params for ownership
    const userId = (req.user._id ?? req.user.id).toString()

    try {
        const { bankName, acctName, acctNumber, eventName, amount } = req.body

        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return next(createError(400, 'A valid positive amount is required'))
        }

        const { availableBalance } = await computeAvailableBalance(userId)
        if (amount > availableBalance) {
            return next(createError(400, 'Amount exceeds available balance'))
        }

        const bank = await Bank.findOne({ user_id: userId, bankName, acctNumber })
        if (!bank) {
            return next(createError(400, 'Add this account under Bank Settings first'))
        }

        const duplicate = await Withdraw.findOne({
            user_id: userId,
            amount,
            status: 'pending',
            createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
        })
        if (duplicate) {
            return next(createError(409, 'A similar withdrawal was already submitted a few minutes ago.'))
        }

        const newWithdraw = new Withdraw({
            bankName,
            acctName,
            acctNumber,
            eventName,
            amount,
            user_id: userId,
        })

        const savedWithdraw = await newWithdraw.save()

        // Notify finance admins about the new payout request
        const io = req.app.locals.io
        const requester = req.user
        notifyAdmins({
            roles: ['finance'],
            type: 'payout_requested',
            title: 'New payout request',
            message: `${requester.name || 'An organizer'} requested ₦${Number(req.body.amount || 0).toLocaleString('en-NG')} withdrawal`,
            data: {
                withdrawId: savedWithdraw._id.toString(),
                userId,
                amount: String(req.body.amount || 0),
                bankName: req.body.bankName || '',
            },
            io,
        }).catch(() => {})

        res.status(200).json(savedWithdraw)
    } catch (err) {
        next(err)
    }
}


// UPDATE
export const updateWithdraw = async (req,res,next) =>{
    try{
        const withdrawId = req.params.id
        const { status, rejectionReason } = req.body

        const withdraw = await Withdraw.findById(withdrawId)
        if (!withdraw) return res.status(404).json({ message: 'Withdrawal request not found' })

        const user = await User.findById(withdraw.user_id)
        const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

        const updatedWithdraw = await Withdraw.findByIdAndUpdate(
            withdrawId,
           { $set: req.body},
           {new: true}
        )

        // Create in-app notifications and enqueue emails (non-blocking)
        const io = req.app.locals.io

        if (status === 'approved' || status === 'sent') {
            // PAYOUT APPROVED/SENT
            await createNotification({
              userId: withdraw.user_id.toString(),
              type: 'payout_approved',
              title: 'Payout approved ✓',
              message: `Your ₦${withdraw.amount?.toLocaleString()} payout is on the way`,
              data: {
                amount: withdraw.amount,
                bankName: withdraw.bankName,
                withdrawId: withdrawId.toString(),
              },
              io,
            }).catch(err => console.error('[Notification] Payout approved failed:', err.message))

        } else if (status === 'rejected') {
            // PAYOUT REJECTED
            await createNotification({
              userId: withdraw.user_id.toString(),
              type: 'payout_rejected',
              title: 'Payout request needs attention',
              message: rejectionReason || 'Please review your bank details',
              data: {
                amount: withdraw.amount,
                rejectionReason: rejectionReason || 'Please review your bank details',
                withdrawId: withdrawId.toString(),
              },
              io,
            }).catch(err => console.error('[Notification] Payout rejected failed:', err.message))

        }

        res.status(200).json(updatedWithdraw)
    }catch(err){
        next(err)
    }
}


// DELETE
export const deleteWithdraw = async (req,res,next) =>{
    try{
        await Withdraw.findByIdAndDelete(
            req.params.id
        )
        res.status(200).json('Withdraw has been deleted')
    }catch(err){
        next(err)
    }
}

// GET
export const getWithdraw = async (req,res,next) =>{
    try{
        const getWithdraw = await Withdraw.findById({_id: req.params.id})
            res.status(200).json(getWithdraw)
    }catch(err){
        next(err)
    }
}

// GET User Withdraws
export const getUserWithdraw = async (req,res,next) =>{
    try{
        const getWithdraw = await Withdraw.find({user_id: req.params.userId})
            res.status(200).json(getWithdraw)
    }catch(err){
        next(err)
    }
}

// GET ALL
export const getAllWithdraws = async (req,res,next) =>{

    try{
        const getWithdraws = await Withdraw.find()
        res.status(200).json(getWithdraws)
    }catch(err){
        next(err)
    }
}