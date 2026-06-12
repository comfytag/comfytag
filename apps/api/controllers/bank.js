// import {Bank, Withdraw} from '../models/Bank.js'
import Bank from '../models/Bank.js';
import Withdraw from '../models/Withdraw.js';
import User from '../models/User.js';
import { enqueueEmail } from '../jobs/emailQueue.js';
import { createNotification } from './notification.js';
import { createError } from '../utils/error.js';


// CREATE Bank

export const createBank = async (req, res, next) => {
    const userId = req.params.userId;
    const acctName =   await User.findById(userId)

    const newBank = new Bank({
        ...req.body,
        user_id: userId,
        acctName: acctName.name,
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
        if ('account_number' in req.body) updateData.account_number = req.body.account_number
        if ('bank_code' in req.body) updateData.bank_code = req.body.bank_code
        if ('account_name' in req.body) updateData.account_name = req.body.account_name
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update. Allowed: account_number, bank_code, account_name.' })
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
export const deleteBank = async (req,res,next) =>{
    try{
        await Bank.findByIdAndDelete(
            req.params.id
        )
        res.status(200).json('Bank has been deleted')
    }catch(err){
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

// GET
export const updateBankStatus = async (req,res,next) =>{
        try {
            const updateStatus = await Bank.findByIdAndUpdate(
                req.params.bankId,
            { $set: req.body},
            {new: true})
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

    const newWithdraw = new Withdraw({
        ...req.body,
        user_id: userId,
    })
    try {
        const savedWithdraw = await newWithdraw.save()
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

            enqueueEmail({
              to: user.email,
              subject: `Your ₦${withdraw.amount?.toLocaleString()} payout is on the way`,
              template: 'payoutApproved.hbs',
              data: {
                organizerName: user.name,
                amount: `₦${withdraw.amount?.toLocaleString()}`,
                bankName: withdraw.bankName || 'Your bank',
                last4Digits: withdraw.acctNumber?.slice(-4) || '****',
                payoutReference: withdrawId.toString(),
                arrivalTime: '24–48 hours',
                dashboardLink: `${baseUrl}/partner/payouts`,
                year: new Date().getFullYear(),
                unsubscribeUrl: `${baseUrl}/partner/preferences?unsub=email`,
                preferencesUrl: `${baseUrl}/partner/preferences`,
              },
              from: 'payouts@comfytag.com',
            }).catch(err => console.error('[Payout Approved] Queue failed:', err.message))
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

            enqueueEmail({
              to: user.email,
              subject: 'Payout request needs attention',
              template: 'payoutRejected.hbs',
              data: {
                organizerName: user.name,
                amount: `₦${withdraw.amount?.toLocaleString()}`,
                rejectionReason: rejectionReason || 'Please review your bank details',
                actionStep: 'Review your bank details and resubmit',
                resubmitLink: `${baseUrl}/partner/payouts/${withdrawId}/resubmit`,
                year: new Date().getFullYear(),
                unsubscribeUrl: `${baseUrl}/partner/preferences?unsub=email`,
                preferencesUrl: `${baseUrl}/partner/preferences`,
              },
              from: 'payouts@comfytag.com',
              replyTo: 'payouts@comfytag.com',
            }).catch(err => console.error('[Payout Rejected] Queue failed:', err.message))
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