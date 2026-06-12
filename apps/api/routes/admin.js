import { Router } from 'express'
import { verifyAdminRole } from '../utils/verifyAdminRole.js'
import {
    // KYC
    approveKyc,
    rejectKyc,
    getKycQueue,
    getKycDetails,
    // Users
    listUsers,
    getUser,
    suspendUser,
    restoreUser,
    deleteUser,
    changeUserRole,
    // Payouts
    processPayout,
    rejectPayout,
    getPendingPayouts,
    getPayout,
    // Events
    listEvents,
    getEvent,
    suspendEvent,
    restoreEvent,
    deleteEvent,
    // Analytics
    getAnalyticsOverview,
    getRevenueAnalytics,
    getUserAnalytics,
    // Settings
    getSettings,
    updateSettings,
    toggleFeatureFlags,
    // Audit & Logs
    getAuditLog,
    getFaceLogs,
    // Notifications
    broadcastNotification,
} from '../controllers/admin.js'

const router = Router()

// ─── KYC Management ───────────────────────────────────────────────────────────
// Note: static segments (/approve, /reject, /queue) must come before /:userId
router.post('/kyc/approve',   verifyAdminRole(['kyc_reviewer', 'finance']),          approveKyc)
router.post('/kyc/reject',    verifyAdminRole(['kyc_reviewer', 'finance']),          rejectKyc)
router.get('/kyc/queue',      verifyAdminRole(['kyc_reviewer', 'finance', 'support']), getKycQueue)
router.get('/kyc/:userId',    verifyAdminRole(['kyc_reviewer', 'finance', 'support']), getKycDetails)

// ─── User Management ──────────────────────────────────────────────────────────
router.get('/users',              verifyAdminRole(['support', 'moderator', 'finance']), listUsers)
router.get('/users/:id',          verifyAdminRole(['support', 'moderator', 'finance']), getUser)
router.patch('/users/:id/suspend', verifyAdminRole(['moderator', 'support']),           suspendUser)
router.patch('/users/:id/restore', verifyAdminRole(['moderator', 'support']),           restoreUser)
router.delete('/users/:id',        verifyAdminRole([]),                                  deleteUser)   // super_admin only
router.patch('/users/:id/role',    verifyAdminRole([]),                                  changeUserRole) // super_admin only

// ─── Payout Management ────────────────────────────────────────────────────────
// Static segments (/process, /reject, /pending) before /:id wildcard
router.post('/payouts/process',   verifyAdminRole(['finance']),           processPayout)
router.post('/payouts/reject',    verifyAdminRole(['finance']),           rejectPayout)
router.get('/payouts/pending',    verifyAdminRole(['finance', 'support']), getPendingPayouts)
router.get('/payouts/:id',        verifyAdminRole(['finance', 'support']), getPayout)

// ─── Event Management ─────────────────────────────────────────────────────────
router.get('/events',                  verifyAdminRole(['moderator', 'support', 'finance']), listEvents)
router.get('/events/:id',              verifyAdminRole(['moderator', 'support', 'finance']), getEvent)
router.patch('/events/:id/suspend',    verifyAdminRole(['moderator']),                        suspendEvent)
router.patch('/events/:id/restore',    verifyAdminRole(['moderator']),                        restoreEvent)
router.delete('/events/:id',           verifyAdminRole([]),                                    deleteEvent)  // super_admin only

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics/overview', verifyAdminRole(['finance', 'support', 'moderator']), getAnalyticsOverview)
router.get('/analytics/revenue',  verifyAdminRole(['finance']),                          getRevenueAnalytics)
router.get('/analytics/users',    verifyAdminRole(['support', 'finance']),               getUserAnalytics)

// ─── Platform Settings (super_admin only) ────────────────────────────────────
router.get('/settings',                  verifyAdminRole([]), getSettings)
router.put('/settings',                  verifyAdminRole([]), updateSettings)
router.patch('/settings/feature-flags',  verifyAdminRole([]), toggleFeatureFlags)

// ─── Audit & Logs (super_admin only) ─────────────────────────────────────────
router.get('/audit-log',  verifyAdminRole([]), getAuditLog)
router.get('/face-logs',  verifyAdminRole([]), getFaceLogs)

// ─── Notifications ────────────────────────────────────────────────────────────
router.post('/notifications/broadcast', verifyAdminRole(['moderator', 'support']), broadcastNotification)

export default router
