import User from '../models/User.js'
import { createError } from '../utils/error.js'

// GET /partner/kyc/:userId
// Returns only KYC verification status (not full user profile)
export const getKycStatus = async (req, res, next) => {
    const { userId } = req.params
    const callerId = (req.user._id ?? req.user.id ?? '').toString()

    try {
        // Verify user can only access their own KYC data
        // (admins can access any user's data)
        if (callerId !== userId && !req.user.isAdmin) {
            return next(createError(403, 'You can only view your own KYC status'))
        }

        const user = await User.findById(userId).select('isVerify')

        if (!user) {
            return next(createError(404, 'User not found'))
        }

        // Return only KYC-relevant fields
        res.status(200).json({
            success: true,
            data: {
                isVerify: user.isVerify || {
                    email: false,
                    photo: false,
                    idCard: false,
                    address: false,
                },
            },
        })
    } catch (err) {
        next(err)
    }
}
