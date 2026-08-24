import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectTestDB, disconnectTestDB, clearCollections } from '../test-utils/db'

import User from '../../models/User'
import Bank from '../../models/Bank'

import bankRouter from '../../routes/bank'

// ============================================================================
// TEST SETUP
// ============================================================================

let app: Express
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
const TEST_SALT = 10

async function createTestUser(overrides = {}) {
  const salt = await bcrypt.genSalt(TEST_SALT)
  const password = await bcrypt.hash('TestPassword123!', salt)

  const user = new User({
    username: `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test User',
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password,
    phone: 2348012345670 + Math.random() * 100,
    isPartner: true,
    isAdmin: false,
    faceEnrolled: false,
    // Schema default for referralCode is an explicit `null`, which a sparse
    // unique index still indexes — a second user without an override in the
    // same test would collide. Always assign a unique code to avoid that.
    referralCode: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  })

  return await user.save()
}

async function createTestBank(userId: string, overrides = {}) {
  const bank = new Bank({
    user_id: userId.toString(),
    bankName: 'Test Bank',
    acctName: 'Test Account',
    acctNumber: '0123456789',
    isActive: false,
    ...overrides,
  })

  return await bank.save()
}

function signTestToken(userId: string | mongoose.Types.ObjectId, isPartner = true, isAdmin = false) {
  return jwt.sign(
    {
      id: userId.toString(),
      _id: userId.toString(),
      email: 'test@example.com',
      isPartner,
      isAdmin,
    },
    TEST_JWT_SECRET,
    { expiresIn: '7d' }
  )
}

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  await connectTestDB()

  app = express()
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
  app.use(cookieParser())

  app.use('/bank', bankRouter)

  app.use((err: any, req: any, res: any, next: any) => {
    const status = err.status || err.statusCode || 500
    const message = err.message || 'Something went wrong'
    res.status(status).json({ success: false, message })
  })
})

afterAll(async () => {
  await disconnectTestDB()
})

beforeEach(async () => {
  await clearCollections()
})

// ============================================================================
// FIX 1 — updateBankStatus IDOR
// ============================================================================

describe('PUT /bank/:userId/:bankId', () => {
  it('rejects a non-owner attempting to toggle another user\'s bank status', async () => {
    const owner = await createTestUser({ name: 'Owner' })
    const attacker = await createTestUser({ name: 'Attacker' })
    const bank = await createTestBank(owner._id.toString())

    const res = await request(app)
      .put(`/bank/${attacker._id}/${bank._id}`)
      .set('Authorization', `Bearer ${signTestToken(attacker._id)}`)
      .send({ isActive: true })

    expect(res.status).toBe(403)

    const unchanged = await Bank.findById(bank._id)
    expect(unchanged?.isActive).toBe(false)
  })

  it('allows the owner to toggle their own bank status', async () => {
    const owner = await createTestUser({ name: 'Owner' })
    const bank = await createTestBank(owner._id.toString())

    const res = await request(app)
      .put(`/bank/${owner._id}/${bank._id}`)
      .set('Authorization', `Bearer ${signTestToken(owner._id)}`)
      .send({ isActive: true })

    expect(res.status).toBe(200)

    const updated = await Bank.findById(bank._id)
    expect(updated?.isActive).toBe(true)
  })

  it('ignores non-whitelisted fields in the request body', async () => {
    const owner = await createTestUser({ name: 'Owner' })
    const bank = await createTestBank(owner._id.toString())

    const res = await request(app)
      .put(`/bank/${owner._id}/${bank._id}`)
      .set('Authorization', `Bearer ${signTestToken(owner._id)}`)
      .send({ isActive: true, bankName: 'Hijacked Bank', user_id: 'someone-else' })

    expect(res.status).toBe(200)

    const updated = await Bank.findById(bank._id)
    expect(updated?.bankName).toBe('Test Bank')
    expect(updated?.user_id).toBe(owner._id.toString())
  })

  it('allows an admin to toggle any user\'s bank status', async () => {
    const owner = await createTestUser({ name: 'Owner' })
    const admin = await createTestUser({ name: 'Admin', isAdmin: true })
    const bank = await createTestBank(owner._id.toString())

    const res = await request(app)
      .put(`/bank/${owner._id}/${bank._id}`)
      .set('Authorization', `Bearer ${signTestToken(admin._id, false, true)}`)
      .send({ isActive: true })

    expect(res.status).toBe(200)
  })
})

// ============================================================================
// FIX 2 — deleteBank ownership check
// ============================================================================

describe('DELETE /bank/:id', () => {
  it('rejects a non-owner attempting to delete another user\'s bank record', async () => {
    const owner = await createTestUser({ name: 'Owner' })
    const attacker = await createTestUser({ name: 'Attacker' })
    const bank = await createTestBank(owner._id.toString())

    const res = await request(app)
      .delete(`/bank/${bank._id}`)
      .set('Authorization', `Bearer ${signTestToken(attacker._id)}`)

    expect(res.status).toBe(403)

    const stillExists = await Bank.findById(bank._id)
    expect(stillExists).not.toBeNull()
  })

  it('allows the owner to delete their own bank record', async () => {
    const owner = await createTestUser({ name: 'Owner' })
    const bank = await createTestBank(owner._id.toString())

    const res = await request(app)
      .delete(`/bank/${bank._id}`)
      .set('Authorization', `Bearer ${signTestToken(owner._id)}`)

    expect(res.status).toBe(200)

    const gone = await Bank.findById(bank._id)
    expect(gone).toBeNull()
  })

  it('allows an admin to delete any user\'s bank record', async () => {
    const owner = await createTestUser({ name: 'Owner' })
    const admin = await createTestUser({ name: 'Admin', isAdmin: true })
    const bank = await createTestBank(owner._id.toString())

    const res = await request(app)
      .delete(`/bank/${bank._id}`)
      .set('Authorization', `Bearer ${signTestToken(admin._id, false, true)}`)

    expect(res.status).toBe(200)
  })
})
