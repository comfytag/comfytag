// import {Bank, Withdraw} from '../models/Bank.js'
import Bank from '../models/Bank.js';
import Withdraw from '../models/Withdraw.js';
import User from '../models/User.js';
import { enqueueEmail } from '../jobs/emailQueue.js';
import { createNotification } from './notification.js';


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
export const updateBank = async (req,res,next) =>{
    try{
        const updatedBank = await Bank.findByIdAndUpdate(
            req.params.id,
           { $set: req.body},
           {new: true}
        )
        res.status(200).json(updatedBank)
    }catch(err){
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

// CREATE Bank
export const createWithdraw = async (req, res, next) => {
    const userId = req.params.userId;


    const newWithdraw = new Withdraw({
        ...req.body,
         user_id: userId,
        //  acctName: acct_name,
        //  acctNumber: paymentDetails.acctNumber,
        //  bankName: paymentDetails.bankName

     });
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