// import {Bank, Withdraw} from '../models/Bank.js'
import Bank from '../models/Bank.js';
import Withdraw from '../models/Withdraw.js';
import { createNotification, notifyAdmins } from './notification.js';
import { createError } from '../utils/error.js';
import { computeAvailableBalance } from './analytics.js';
import { listBanks, resolveAccountNumber, createTransferRecipient, PaystackApiError } from '../utils/paystack.js';

// In-process cache for Paystack's bank list — it changes rarely, so there's
// no need to hit their API on every dropdown render. No Redis needed: per-instance
// staleness (up to 24h) is harmless for a reference list like this.
let bankListCache = { data: null, fetchedAt: 0 }
const BANK_LIST_TTL_MS = 24 * 60 * 60 * 1000

const getCachedBankList = async () => {
    const isFresh = bankListCache.data && (Date.now() - bankListCache.fetchedAt) < BANK_LIST_TTL_MS
    if (!isFresh) {
        const { data } = await listBanks()
        bankListCache = { data, fetchedAt: Date.now() }
    }
    return bankListCache.data
}

// GET /bank/list — Nigerian banks with their Paystack bank codes
export const getBankList = async (req, res, next) => {
    try {
        res.status(200).json(await getCachedBankList())
    } catch (err) {
        next(err)
    }
}


// CREATE Bank

export const createBank = async (req, res, next) => {
    const userId = req.params.userId;
    const { bankCode, acctNumber } = req.body

    if (!bankCode || !acctNumber) {
        return next(createError(400, 'bankCode and acctNumber are required.'))
    }

    try {
        // Resolve against Paystack first — acctName is never trusted from the
        // client. This also catches invalid account numbers before anything
        // is saved (previously acctName was silently set to the platform
        // user's own display name, not the real bank account holder).
        let resolved
        try {
            const { data } = await resolveAccountNumber(acctNumber, bankCode)
            resolved = data
        } catch (err) {
            if (err instanceof PaystackApiError) {
                return next(createError(400, err.message || 'Could not verify this bank account.'))
            }
            throw err
        }

        const bankList = await getCachedBankList()
        const matchedBank = bankList?.find(b => b.code === bankCode)

        const newBank = new Bank({
            user_id: userId,
            bankCode,
            bankName: matchedBank?.name || req.body.bankName || '',
            acctNumber,
            acctName: resolved.account_name,
            isActive: true,
        })

        const savedBank = await newBank.save()

        // Create the transfer recipient in the same request. If this fails,
        // still keep the resolved Bank doc — the resolution itself succeeded
        // and is the expensive/valuable part; payouts are simply blocked
        // against this account (recipientCode stays null) until retried.
        try {
            const { data: recipient } = await createTransferRecipient({
                name: resolved.account_name,
                account_number: acctNumber,
                bank_code: bankCode,
            })
            savedBank.recipientCode = recipient.recipient_code
            await savedBank.save()
        } catch (err) {
            console.error('[Bank] Transfer recipient creation failed:', err.message)
        }

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

        // bankName/bankCode/acctName/acctNumber are Paystack-resolved and tied
        // to a recipientCode created for that exact account — editing them in
        // place would desync the record from what Paystack actually verified.
        // Changing account details must go through delete + re-add so the new
        // account gets its own resolution and recipient code.
        const blockedFields = ['bankName', 'bankCode', 'acctName', 'acctNumber'].filter(f => f in req.body)
        if (blockedFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bank account details cannot be edited. Delete this account and add it again to change bank, account number, or account name.',
            })
        }

        return res.status(400).json({ success: false, message: 'No editable fields were provided.' })
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
            bankId: bank._id,
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


// UPDATE — status changes only, and only the transitions a finance admin may
// make by hand. This endpoint must NEVER be able to set `processing`/`sent`
// — those are exclusively reachable via admin.js#processPayout (the real
// Paystack transfer call) and the Paystack transfer webhook. Every field
// other than `status`/`rejectionReason` is rejected outright — this used to
// be `$set: req.body`, which let a caller overwrite amount/bankName/
// acctNumber/user_id/transferCode/anything else in the document (see
// discussion/security — the P0 fix this replaces). Route-level access is
// gated to `verifyAdminRole(['finance'])` (see routes/withdraw.js).
const WITHDRAW_STATUS_TRANSITIONS = {
    pending: ['approved', 'rejected'],
    approved: ['rejected'],
}

export const updateWithdraw = async (req, res, next) => {
    try {
        const withdrawId = req.params.id
        const allowedFields = ['status', 'rejectionReason']
        const unexpectedFields = Object.keys(req.body).filter(f => !allowedFields.includes(f))
        if (unexpectedFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Unexpected field(s): ${unexpectedFields.join(', ')}`,
            })
        }

        const { status, rejectionReason } = req.body
        if (!status) {
            return res.status(400).json({ success: false, message: 'status is required' })
        }

        const withdraw = await Withdraw.findById(withdrawId)
        if (!withdraw) return res.status(404).json({ message: 'Withdrawal request not found' })

        const allowedNextStatuses = WITHDRAW_STATUS_TRANSITIONS[withdraw.status] || []
        if (!allowedNextStatuses.includes(status)) {
            return res.status(409).json({
                success: false,
                message: `Cannot change status from '${withdraw.status}' to '${status}' via this endpoint.`,
            })
        }

        const update = { status }
        if (status === 'rejected') {
            update.failureReason = rejectionReason || null
        }

        const updatedWithdraw = await Withdraw.findByIdAndUpdate(
            withdrawId,
            { $set: update },
            { new: true }
        )

        // Create in-app notifications (non-blocking)
        const io = req.app.locals.io

        if (status === 'approved') {
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
    } catch (err) {
        next(err)
    }
}


// DELETE — ownership-checked (previously any authenticated caller could
// delete any user's withdrawal by id, silently un-counting it from
// computeAvailableBalance).
export const deleteWithdraw = async (req, res, next) => {
    try {
        const withdraw = await Withdraw.findById(req.params.id)
        if (!withdraw) return res.status(404).json({ message: 'Withdrawal request not found' })

        const requesterId = (req.user._id ?? req.user.id ?? '').toString()
        if (withdraw.user_id.toString() !== requesterId && !req.user.isAdmin) {
            return next(createError(403, 'You are not authorized!'))
        }

        await Withdraw.findByIdAndDelete(req.params.id)
        res.status(200).json('Withdraw has been deleted')
    } catch (err) {
        next(err)
    }
}

// GET
export const getWithdraw = async (req,res,next) =>{
    try{
        const getWithdraw = await Withdraw.findById(req.params.id)
        if (!getWithdraw) return next(createError(404, 'Withdraw record not found'))

        // `:id` here is the Withdraw record's own id, not the caller's user
        // id — ownership must be checked against `withdraw.user_id` directly
        // (same reasoning already documented on the DELETE route above).
        const requesterId = (req.user._id ?? req.user.id ?? '').toString()
        if (getWithdraw.user_id !== requesterId && !req.user.isAdmin) {
            return next(createError(403, 'You are not authorized!'))
        }

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