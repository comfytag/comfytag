import PushToken from '../models/PushToken.js'
import { createError } from '../utils/error.js'

// POST /push-tokens
// Register a device push token for the logged-in user
export const registerPushToken = async (req, res, next) => {
  try {
    const { token, platform, deviceId } = req.body
    const userId = req.user.id

    if (!token || !platform) {
      return next(createError(400,
        'token and platform are required'))
    }

    // Upsert — update if token exists, create if not
    await PushToken.findOneAndUpdate(
      { token },
      {
        user_id: userId,
        token,
        platform,
        deviceId: deviceId || null,
        active: true,
      },
      { upsert: true, new: true }
    )

    res.status(200).json({
      message: 'Push token registered'
    })
  } catch (err) {
    next(err)
  }
}

// DELETE /push-tokens
// Deactivate push token on logout
export const deregisterPushToken = async (req, res, next) => {
  try {
    const { token } = req.body
    if (!token) {
      return next(createError(400, 'token is required'))
    }

    await PushToken.findOneAndUpdate(
      { token, user_id: req.user.id },
      { active: false }
    )

    res.status(200).json({
      message: 'Push token deregistered'
    })
  } catch (err) {
    next(err)
  }
}
