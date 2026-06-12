import { verifyToken } from './verifyToken.js'
import { createError } from './error.js'

/**
 * RBAC middleware factory for admin routes.
 *
 * Usage:
 *   verifyAdminRole(['kyc_reviewer', 'finance'])   — those two roles + super_admin
 *   verifyAdminRole([])                             — super_admin only
 *
 * super_admin always passes regardless of the allowedRoles list.
 * Tokens minted before this change won't carry a `role` claim and are treated
 * as 'viewer' (least privilege) until the user logs in again (7-day TTL).
 *
 * @param {string[]} allowedRoles - Roles permitted beyond super_admin
 */
export const verifyAdminRole = (allowedRoles = []) => (req, res, next) => {
    verifyToken(req, res, (err) => {
        if (err) return next(err)

        if (!req.user.isAdmin) {
            return next(createError(403, 'Admin access required.'))
        }

        const userRole = req.user.role || 'viewer'

        // super_admin bypasses all role restrictions
        if (userRole === 'super_admin' || allowedRoles.includes(userRole)) {
            return next()
        }

        return next(
            createError(403, `Forbidden: role '${userRole}' does not have permission for this action.`)
        )
    })
}
