import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Withdraw from '../models/Withdraw.js'
import Event from '../models/Event.js'
import SiteConfig from '../models/SiteConfig.js'
import { createError } from '../utils/error.js'
import { createNotification } from './notification.js'
import { generateReferralCode, generateFallbackCode } from '../utils/referralCode.js'

// ─────────────────────────────────────────────────────────────────────────────
// KYC Management  (full implementation)
// ─────────────────────────────────────────────────────────────────────────────

const KYC_FIELD_MAP = {
    photo:   { 'isVerify.photo':  true },
    idcard:  { 'isVerify.idCard': true },
    address: { 'isVerify.address': true },
}

// POST /api/admin/kyc/approve
// Body: { userId: string, kycType: 'photo' | 'idcard' | 'address' }
export const approveKyc = async (req, res, next) => {
    try {
        const { userId, kycType } = req.body

        if (!userId || !kycType) {
            return next(createError(400, 'userId and kycType are required.'))
        }

        if (!KYC_FIELD_MAP[kycType]) {
            return next(createError(400, `kycType must be one of: ${Object.keys(KYC_FIELD_MAP).join(', ')}`))
        }

        const user = await User.findById(userId)
        if (!user) return next(createError(404, 'User not found.'))

        // Atomic $set — only the targeted isVerify sub-field is touched;
        // sibling fields (photo, idCard, address) are preserved as-is.
        await User.findByIdAndUpdate(
            userId,
            { $set: { ...KYC_FIELD_MAP[kycType], kycStatus: 'verified' } },
            { new: true, runValidators: true }
        )

        const baseUrl = process.env.BASE_URL || 'https://comfytag.com'
        const io = req.app.locals.io

        await createNotification({
            userId,
            type: 'kyc_approved',
            title: 'Identity verified ✓',
            message: 'You are now verified and can receive payouts',
            data: {
                verifyType: kycType,
                bankSetupLink: `${baseUrl}/partner/settings/bank`,
            },
            io,
        }).catch(err => console.error('[Admin KYC] Notification error:', err.message))

        return res.status(200).json({
            success: true,
            message: `KYC '${kycType}' approved for user ${userId}.`,
            data: { userId, kycType, kycStatus: 'verified' },
        })
    } catch (err) {
        next(err)
    }
}

// POST /api/admin/kyc/reject
// Body: { userId: string, rejectionReason?: string }
export const rejectKyc = async (req, res, next) => {
    try {
        const { userId, rejectionReason } = req.body

        if (!userId) return next(createError(400, 'userId is required.'))

        const user = await User.findById(userId)
        if (!user) return next(createError(404, 'User not found.'))

        const reason = (rejectionReason ?? '').trim() || 'Document clarity issue'

        // Atomic $set — no other user fields are disturbed
        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    kycStatus: 'rejected',
                    kycRejectionReason: reason,
                    kycRejectedAt: new Date(),
                },
            },
            { new: true }
        )

        const baseUrl = process.env.BASE_URL || 'https://comfytag.com'
        const io = req.app.locals.io

        await createNotification({
            userId,
            type: 'kyc_rejected',
            title: 'KYC verification not approved',
            message: 'Please resubmit clearer documents',
            data: { rejectionReason: reason, reuploadLink: `${baseUrl}/partner/kyc` },
            io,
        }).catch(err => console.error('[Admin KYC] Rejection notification error:', err.message))

        return res.status(200).json({
            success: true,
            message: `KYC rejected for user ${userId}.`,
            data: { userId, kycStatus: 'rejected', rejectionReason: reason },
        })
    } catch (err) {
        next(err)
    }
}

// GET /api/admin/kyc/queue
// Query: page, limit
export const getKycQueue = async (req, res, next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1)
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
        const skip  = (page - 1) * limit

        const filter = {
            isPartner: true,
            $or: [
                { kycStatus: 'pending' },
                { kycStatus: null },
                { kycStatus: { $exists: false } },
            ],
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('name email username businessName isVerify kycStatus verify createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
    } catch (err) {
        next(err)
    }
}

// GET /api/admin/kyc/:userId
export const getKycDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId).select(
            'name email username businessName phone address isVerify kycStatus kycRejectionReason kycRejectedAt verify faceEnrolled faceEnrolledAt createdAt'
        )
        if (!user) return next(createError(404, 'User not found.'))
        return res.status(200).json({ success: true, data: user })
    } catch (err) {
        next(err)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// User Management
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/users
export const listUsers = async (req, res, next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1)
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25))
        const skip  = (page - 1) * limit
        const filter = {}
        if (req.query.role)        filter.role      = req.query.role
        if (req.query.isPartner)   filter.isPartner = req.query.isPartner === 'true'
        if (req.query.suspended)   filter.suspended = req.query.suspended === 'true'

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password -totpSecret -faceTemplate -faceEnrollmentDevice')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
    } catch (err) {
        next(err)
    }
}

// GET /api/admin/users/:id
export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -totpSecret -faceTemplate -faceEnrollmentDevice')
        if (!user) return next(createError(404, 'User not found.'))
        return res.status(200).json({ success: true, data: user })
    } catch (err) {
        next(err)
    }
}

// PATCH /api/admin/users/:id/suspend
export const suspendUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { suspended: true } },
            { new: true }
        ).select('-password')
        if (!user) return next(createError(404, 'User not found.'))
        return res.status(200).json({
            success: true,
            message: 'User suspended.',
            data: { userId: user._id, suspended: true },
        })
    } catch (err) {
        next(err)
    }
}

// PATCH /api/admin/users/:id/restore
export const restoreUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { suspended: false } },
            { new: true }
        ).select('-password')
        if (!user) return next(createError(404, 'User not found.'))
        return res.status(200).json({
            success: true,
            message: 'User restored.',
            data: { userId: user._id, suspended: false },
        })
    } catch (err) {
        next(err)
    }
}

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id)
        if (!user) return next(createError(404, 'User not found.'))
        return res.status(200).json({
            success: true,
            message: 'User deleted.',
            data: { userId: req.params.id },
        })
    } catch (err) {
        next(err)
    }
}

// PATCH /api/admin/users/:id/role
// Body: { role: string }
export const changeUserRole = async (req, res, next) => {
    try {
        const VALID_ROLES = ['super_admin', 'finance', 'kyc_reviewer', 'support', 'moderator', 'viewer']
        const { role } = req.body

        if (!role || !VALID_ROLES.includes(role)) {
            return next(createError(400, `role must be one of: ${VALID_ROLES.join(', ')}`))
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    role,
                    // Demoting to viewer revokes admin flag; any other role grants it
                    isAdmin: role !== 'viewer',
                },
            },
            { new: true }
        ).select('-password')

        if (!user) return next(createError(404, 'User not found.'))
        return res.status(200).json({
            success: true,
            message: 'User role updated.',
            data: { userId: user._id, role, isAdmin: user.isAdmin },
        })
    } catch (err) {
        next(err)
    }
}

// POST /api/admin/users/create-admin (super_admin only)
// Creates a new staff/admin account with a specific role. The public
// /auth/register endpoint deliberately ignores isAdmin/role from the request
// body (it would otherwise let anyone self-register as an admin), so staff
// accounts must be created through this route instead.
export const createAdminUser = async (req, res, next) => {
    try {
        const VALID_ROLES = ['super_admin', 'finance', 'kyc_reviewer', 'support', 'moderator']
        const { name, username, email, password, role } = req.body

        if (!name || !username || !email || !password) {
            return next(createError(400, 'name, username, email, and password are required.'))
        }
        if (!role || !VALID_ROLES.includes(role)) {
            return next(createError(400, `role must be one of: ${VALID_ROLES.join(', ')}`))
        }

        const existingEmail = await User.findOne({ email: email.toLowerCase() })
        if (existingEmail) return next(createError(409, 'User with given email already exists.'))

        const existingUsername = await User.findOne({ username })
        if (existingUsername) return next(createError(409, 'Username already exists.'))

        const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const referralCode = generateReferralCode(username, name)

        const user = new User({
            name,
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            isAdmin: true,
            // Staff accounts are created directly by an existing admin, not
            // self-registered — treat email as already verified so the new
            // admin can sign in immediately.
            isVerify: { email: true },
            referralCode,
        })
        await user.save()

        const fallbackCode = generateFallbackCode(user._id)
        if (fallbackCode) {
            user.referralFallbackCode = fallbackCode
            await user.save()
        }

        const { password: _pw, ...userWithoutPassword } = user.toObject()
        res.status(201).json({ success: true, data: userWithoutPassword })
    } catch (err) {
        next(err)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payout Management
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/admin/payouts/process
// Body: { withdrawId: string }
export const processPayout = async (req, res, next) => {
    try {
        const { withdrawId } = req.body
        if (!withdrawId) return next(createError(400, 'withdrawId is required.'))

        const withdrawal = await Withdraw.findByIdAndUpdate(
            withdrawId,
            { $set: { status: 'sent' } },
            { new: true }
        )
        if (!withdrawal) return next(createError(404, 'Withdrawal request not found.'))

        const io = req.app.locals.io
        const baseUrl = process.env.BASE_URL || 'https://comfytag.com'

        await createNotification({
            userId: withdrawal.user_id,
            type: 'payout_approved',
            title: 'Payout sent ✓',
            message: `₦${withdrawal.amount.toLocaleString()} has been sent to your ${withdrawal.bankName} account`,
            data: {
                amount: withdrawal.amount,
                bankName: withdrawal.bankName,
                acctName: withdrawal.acctName,
                withdrawId,
            },
            io,
        }).catch(err => console.error('[Admin Payout] Notification error:', err.message))

        return res.status(200).json({
            success: true,
            message: 'Payout marked as sent.',
            data: withdrawal,
        })
    } catch (err) {
        next(err)
    }
}

// POST /api/admin/payouts/reject
// Body: { withdrawId: string, reason?: string }
export const rejectPayout = async (req, res, next) => {
    try {
        const { withdrawId, reason } = req.body
        if (!withdrawId) return next(createError(400, 'withdrawId is required.'))

        const withdrawal = await Withdraw.findByIdAndUpdate(
            withdrawId,
            { $set: { status: 'rejected' } },
            { new: true }
        )
        if (!withdrawal) return next(createError(404, 'Withdrawal request not found.'))

        const io = req.app.locals.io
        const baseUrl = process.env.BASE_URL || 'https://comfytag.com'
        const rejectionReason = (reason ?? '').trim() || 'Please contact support for details'

        await createNotification({
            userId: withdrawal.user_id,
            type: 'payout_rejected',
            title: 'Payout request rejected',
            message: 'Your withdrawal could not be processed at this time',
            data: {
                amount: withdrawal.amount,
                rejectionReason,
                supportLink: `${baseUrl}/support/chat`,
                withdrawId,
            },
            io,
        }).catch(err => console.error('[Admin Payout] Rejection notification error:', err.message))

        return res.status(200).json({
            success: true,
            message: 'Payout rejected.',
            data: { withdrawId, status: 'rejected', reason: rejectionReason },
        })
    } catch (err) {
        next(err)
    }
}

// GET /api/admin/payouts/pending
export const getPendingPayouts = async (req, res, next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1)
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
        const skip  = (page - 1) * limit

        const [withdrawals, total] = await Promise.all([
            Withdraw.find({ status: 'pending' }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Withdraw.countDocuments({ status: 'pending' }),
        ])

        return res.status(200).json({
            success: true,
            data: withdrawals,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
    } catch (err) {
        next(err)
    }
}

// GET /api/admin/payouts/:id
export const getPayout = async (req, res, next) => {
    try {
        const withdrawal = await Withdraw.findById(req.params.id)
        if (!withdrawal) return next(createError(404, 'Withdrawal request not found.'))
        return res.status(200).json({ success: true, data: withdrawal })
    } catch (err) {
        next(err)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Management
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/events
export const listEvents = async (req, res, next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1)
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25))
        const skip  = (page - 1) * limit
        const filter = {}
        if (req.query.status) filter.status = req.query.status

        const [events, total] = await Promise.all([
            Event.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Event.countDocuments(filter),
        ])

        return res.status(200).json({
            success: true,
            data: events,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
    } catch (err) {
        next(err)
    }
}

// GET /api/admin/events/:id
export const getEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id)
        if (!event) return next(createError(404, 'Event not found.'))
        return res.status(200).json({ success: true, data: event })
    } catch (err) {
        next(err)
    }
}

// PATCH /api/admin/events/:id/suspend
export const suspendEvent = async (req, res, next) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'cancelled' } },
            { new: true }
        )
        if (!event) return next(createError(404, 'Event not found.'))
        return res.status(200).json({
            success: true,
            message: 'Event suspended (status → cancelled).',
            data: { eventId: event._id, status: 'cancelled' },
        })
    } catch (err) {
        next(err)
    }
}

// PATCH /api/admin/events/:id/restore
export const restoreEvent = async (req, res, next) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'published' } },
            { new: true }
        )
        if (!event) return next(createError(404, 'Event not found.'))
        return res.status(200).json({
            success: true,
            message: 'Event restored (status → published).',
            data: { eventId: event._id, status: 'published' },
        })
    } catch (err) {
        next(err)
    }
}

// DELETE /api/admin/events/:id
export const deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id)
        if (!event) return next(createError(404, 'Event not found.'))
        return res.status(200).json({
            success: true,
            message: 'Event deleted.',
            data: { eventId: req.params.id },
        })
    } catch (err) {
        next(err)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/overview
export const getAnalyticsOverview = async (req, res, next) => {
    try {
        const [totalUsers, totalEvents, pendingKyc, pendingPayouts] = await Promise.all([
            User.countDocuments(),
            Event.countDocuments(),
            User.countDocuments({ isPartner: true, $or: [{ kycStatus: 'pending' }, { kycStatus: null }] }),
            Withdraw.countDocuments({ status: 'pending' }),
        ])

        return res.status(200).json({
            success: true,
            data: { totalUsers, totalEvents, pendingKyc, pendingPayouts },
        })
    } catch (err) {
        next(err)
    }
}

// GET /api/admin/analytics/revenue — scaffold pending Paystack integration
export const getRevenueAnalytics = (_req, res) => {
    res.status(501).json({
        success: false,
        message: 'Revenue analytics — implementation pending (requires Paystack transaction ledger integration).',
    })
}

// GET /api/admin/analytics/users
export const getUserAnalytics = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const [totalUsers, newUsers, totalPartners] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ isPartner: true }),
        ])

        return res.status(200).json({
            success: true,
            data: { totalUsers, newUsersLast30Days: newUsers, totalPartners },
        })
    } catch (err) {
        next(err)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform Settings — scaffold pending Settings model
// ─────────────────────────────────────────────────────────────────────────────

export const getSettings = async (_req, res, next) => {
    try {
        const config = await SiteConfig.findOne({}) ?? await SiteConfig.create({})
        return res.status(200).json({ success: true, data: config })
    } catch (err) {
        next(err)
    }
}

export const updateSettings = async (req, res, next) => {
    try {
        const config = await SiteConfig.findOneAndUpdate(
            {},
            req.body,
            { upsert: true, new: true, setDefaultsOnInsert: true },
        )
        return res.status(200).json({ success: true, data: config })
    } catch (err) {
        next(err)
    }
}

export const toggleFeatureFlags = (_req, res) => {
    res.status(501).json({ success: false, message: 'Feature flags — implementation pending (Settings model required).' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit & Logs
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/audit-log — scaffold pending AuditLog model
export const getAuditLog = (_req, res) => {
    res.status(501).json({ success: false, message: 'Audit log — implementation pending (AuditLog model required).' })
}

// GET /api/admin/face-logs
export const getFaceLogs = async (req, res, next) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1)
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
        const skip  = (page - 1) * limit

        const [users, total] = await Promise.all([
            User.find({ faceEnrolled: true })
                .select('name email username faceEnrolled faceEnrolledAt')
                .sort({ faceEnrolledAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments({ faceEnrolled: true }),
        ])

        return res.status(200).json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
    } catch (err) {
        next(err)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/admin/notifications/broadcast
// Body: { title: string, message: string, type?: string, filter?: object }
export const broadcastNotification = async (req, res, next) => {
    try {
        const { title, message, type = 'admin_broadcast', filter = {} } = req.body

        if (!title || !message) {
            return next(createError(400, 'title and message are required.'))
        }

        const users = await User.find(filter).select('_id')
        const io = req.app.locals.io

        const results = await Promise.allSettled(
            users.map(u =>
                createNotification({ userId: u._id.toString(), type, title, message, data: {}, io })
            )
        )

        const succeeded = results.filter(r => r.status === 'fulfilled').length
        const failed    = results.length - succeeded

        return res.status(200).json({
            success: true,
            message: `Broadcast sent to ${succeeded} user(s). ${failed} failed.`,
            data: { sent: succeeded, failed, total: results.length },
        })
    } catch (err) {
        next(err)
    }
}
