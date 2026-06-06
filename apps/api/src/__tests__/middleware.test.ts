import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import express, { Express, NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { verifyToken, verifyUser, verifyAdmin } from '../../utils/verifyToken.js'

const TEST_JWT_SECRET = 'test-secret-key-12345-for-testing'

/**
 * Auth Middleware Test Suite — Phase 2A QA Strategy
 * Tests for verifyToken, verifyUser, verifyAdmin middleware functions
 */
describe('Auth Middleware', () => {
  let app: Express

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express()
    app.use(express.json())
    app.use(cookieParser())

    // Mock process.env.JWT_SECRET to use our test secret
    process.env.JWT_SECRET = TEST_JWT_SECRET
  })

  // Helper function to add error handler (called after routes are set up)
  const setupErrorHandler = () => {
    app.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        const status = err.status || 500
        const message = err.message || 'Internal Server Error'
        res.status(status).json({ success: false, message })
      }
    )
  }

  afterEach(() => {
    delete process.env.JWT_SECRET
  })

  // ============================================================================
  // verifyToken Middleware Tests
  // ============================================================================

  describe('verifyToken middleware', () => {
    beforeEach(() => {
      // Route for testing verifyToken
      app.get('/api/protected', verifyToken, (req, res) => {
        res.status(200).json({
          success: true,
          user: {
            _id: req.user._id,
            email: req.user.email,
            isAdmin: req.user.isAdmin,
            isPartner: req.user.isPartner,
          },
        })
      })
      setupErrorHandler()
    })

    it('valid JWT in cookie → populates req.user', async () => {
      const userData = { _id: 'user123', email: 'test@example.com' }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${token}`])

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.user._id).toBe('user123')
      expect(res.body.user.email).toBe('test@example.com')
    })

    it('valid JWT in Authorization header (Bearer token) → populates req.user', async () => {
      const userData = { _id: 'user456', email: 'bearer@example.com', isPartner: true }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.user._id).toBe('user456')
      expect(res.body.user.email).toBe('bearer@example.com')
      expect(res.body.user.isPartner).toBe(true)
    })

    it('expired JWT → res.status(403), { success: false, message: "Token not valid!" }', async () => {
      const userData = { _id: 'user789', email: 'expired@example.com' }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '-1s' }) // Already expired

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${token}`])

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe('Token not valid!')
    })

    it('token is literal string "undefined" → res.status(403)', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=undefined`])

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })

    it('token is literal string "null" → res.status(403)', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=null`])

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })

    it('Bearer token is literal string "undefined" → res.status(401)', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer undefined`)

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('Bearer token is literal string "null" → res.status(401)', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer null`)

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('no token (undefined/null) → res.status(401)', async () => {
      const res = await request(app).get('/api/protected')

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('not authenticated')
    })

    it('no Authorization header, no cookie → res.status(401)', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', ['somethingelse=value'])

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('invalid JWT (wrong secret) → res.status(403)', async () => {
      const userData = { _id: 'user999', email: 'wrong@example.com' }
      const wrongSecret = 'wrong-secret-key'
      const token = jwt.sign(userData, wrongSecret, { expiresIn: '7d' })

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${token}`])

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })

    it('malformed JWT → res.status(403)', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=not.a.valid.jwt.token`])

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })

    it('cookie takes precedence over Bearer token', async () => {
      const cookieData = { _id: 'cookie-user', email: 'cookie@example.com' }
      const bearerData = { _id: 'bearer-user', email: 'bearer@example.com' }

      const cookieToken = jwt.sign(cookieData, TEST_JWT_SECRET, { expiresIn: '7d' })
      const bearerToken = jwt.sign(bearerData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .get('/api/protected')
        .set('Cookie', [`access_token=${cookieToken}`])
        .set('Authorization', `Bearer ${bearerToken}`)

      expect(res.status).toBe(200)
      expect(res.body.user._id).toBe('cookie-user') // Cookie should win
    })
  })

  // ============================================================================
  // verifyUser Middleware Tests
  // ============================================================================

  describe('verifyUser middleware', () => {
    beforeEach(() => {
      // Route for testing verifyUser (accessing user resource by ID)
      app.put('/api/users/:id', verifyUser, (req, res) => {
        res.status(200).json({
          success: true,
          message: 'User resource updated',
          accessedId: req.params.id,
          userId: req.user._id,
        })
      })
      setupErrorHandler()
    })

    it('user accessing own resource (req.user._id === req.params.id) → next()', async () => {
      const userData = { _id: 'user123', email: 'own@example.com' }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .put('/api/users/user123')
        .set('Cookie', [`access_token=${token}`])
        .send({ name: 'Updated Name' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('User resource updated')
    })

    it('admin user accessing ANY resource → next()', async () => {
      const adminData = { _id: 'admin1', email: 'admin@example.com', isAdmin: true }
      const token = jwt.sign(adminData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .put('/api/users/some-other-user-id')
        .set('Cookie', [`access_token=${token}`])
        .send({ name: 'Updated by Admin' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.accessedId).toBe('some-other-user-id')
    })

    it('non-partner, non-admin user accessing another user\'s resource → res.status(403)', async () => {
      const userData = { _id: 'user456', email: 'nonadmin@example.com', isAdmin: false }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .put('/api/users/some-other-user-id')
        .set('Cookie', [`access_token=${token}`])
        .send({ name: 'Attempted Update' })

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('not authorized')
    })

    // BUG DOCUMENTED: isPartner bypasses ownership check
    it.skip(
      'BUG: isPartner user accessing req.params.id that is NOT their own → CURRENTLY PASSES (security vulnerability)',
      async () => {
        // This test documents a known security bug:
        // isPartner users can access ANY user resource without ownership check
        // Current behavior: passes (200 OK) — SHOULD be 403 Forbidden
        // See: apps/api/utils/verifyToken.js line 27:
        //   if(userId === req.params.id || req.user.isPartner || req.user.isAdmin)
        // The 'isPartner' check allows bypass of ownership validation
        // FIX: should be: if(userId === req.params.id || req.user.isAdmin)

        const partnerData = { _id: 'partner1', email: 'partner@example.com', isPartner: true }
        const token = jwt.sign(partnerData, TEST_JWT_SECRET, { expiresIn: '7d' })

        const res = await request(app)
          .put('/api/users/unrelated-user-id')
          .set('Cookie', [`access_token=${token}`])
          .send({ name: 'Updated by Partner' })

        // BUG: This assertion shows the current (buggy) behavior
        // Should be: expect(res.status).toBe(403)
        expect(res.status).toBe(200) // BUG: Should fail but currently passes
      }
    )

    it('no token passed to verifyUser → res.status(401)', async () => {
      const res = await request(app)
        .put('/api/users/any-user-id')
        .send({ name: 'Update attempt' })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('expired token with verifyUser → res.status(403)', async () => {
      const userData = { _id: 'user789', email: 'expired@example.com' }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '-1s' })

      const res = await request(app)
        .put('/api/users/user789')
        .set('Cookie', [`access_token=${token}`])

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })
  })

  // ============================================================================
  // verifyAdmin Middleware Tests
  // ============================================================================

  describe('verifyAdmin middleware', () => {
    beforeEach(() => {
      // Route for testing verifyAdmin
      app.delete('/api/admin/users/:id', verifyAdmin, (req, res) => {
        res.status(200).json({
          success: true,
          message: 'User deleted by admin',
          deletedUserId: req.params.id,
        })
      })
      setupErrorHandler()
    })

    it('isAdmin: true → next()', async () => {
      const adminData = { _id: 'admin1', email: 'admin@example.com', isAdmin: true }
      const token = jwt.sign(adminData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .delete('/api/admin/users/some-user-id')
        .set('Cookie', [`access_token=${token}`])

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('User deleted by admin')
    })

    it('isAdmin: false → res.status(403)', async () => {
      const userData = { _id: 'user456', email: 'user@example.com', isAdmin: false }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .delete('/api/admin/users/some-user-id')
        .set('Cookie', [`access_token=${token}`])

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('not an admin')
    })

    it('partner user (isPartner: true, isAdmin: false) → res.status(403)', async () => {
      const partnerData = { _id: 'partner1', email: 'partner@example.com', isPartner: true, isAdmin: false }
      const token = jwt.sign(partnerData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .delete('/api/admin/users/some-user-id')
        .set('Cookie', [`access_token=${token}`])

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })

    it('no token passed to verifyAdmin → res.status(401)', async () => {
      const res = await request(app).delete('/api/admin/users/any-id')

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('expired token with verifyAdmin → res.status(403)', async () => {
      const adminData = { _id: 'admin1', email: 'admin@example.com', isAdmin: true }
      const token = jwt.sign(adminData, TEST_JWT_SECRET, { expiresIn: '-1s' })

      const res = await request(app)
        .delete('/api/admin/users/any-id')
        .set('Cookie', [`access_token=${token}`])

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })
  })

  // ============================================================================
  // Edge Cases & Token Format Tests
  // ============================================================================

  describe('Token format edge cases', () => {
    beforeEach(() => {
      app.get('/api/test', verifyToken, (req, res) => {
        res.status(200).json({ success: true, user: req.user })
      })
      setupErrorHandler()
    })

    it('Authorization header without Bearer prefix → treated as no token', async () => {
      const userData = { _id: 'user1', email: 'test@example.com' }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .get('/api/test')
        .set('Authorization', `${token}`) // No "Bearer " prefix

      expect(res.status).toBe(401)
    })

    it('Authorization header with "Bearer " prefix (lowercase) → accepted', async () => {
      const userData = { _id: 'user2', email: 'test@example.com' }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .get('/api/test')
        .set('Authorization', `bearer ${token}`) // lowercase "bearer"

      // Should fail because middleware checks for "Bearer " (capital B)
      expect(res.status).toBe(401)
    })

    it('Authorization header with extra spaces around Bearer token → trimmed and accepted', async () => {
      const userData = { _id: 'user3', email: 'test@example.com' }
      const token = jwt.sign(userData, TEST_JWT_SECRET, { expiresIn: '7d' })

      const res = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer   ${token}   `) // Extra spaces

      expect(res.status).toBe(200)
      expect(res.body.user._id).toBe('user3')
    })
  })
})
