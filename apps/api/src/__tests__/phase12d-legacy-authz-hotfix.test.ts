import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { connectAmbientMemoryDb, disconnectAmbientMemoryDb, clearAmbientCollections } from './identity/test-support/ambient-memory-db'

import User from '../../models/User'
import Event from '../../models/Event'
import Withdraw from '../../models/Withdraw'
import withdrawRouter from '../../routes/withdraw.js'
import eventRouter from '../../routes/event.js'

// ============================================================================
// Phase 12D — emergency legacy security hotfix regression tests
// ============================================================================
//
// NOTE: the public-response allowlist on GET /users/:id, GET /events/:id/promos
// ownership, POST /face/verify ownership, and GET /withdraw/show/:id ownership
// already have dedicated coverage in phase10-idor-security-regression.test.ts
// (a pre-existing, uncommitted Phase 10 suite discovered during this audit) —
// deliberately NOT duplicated here. This file covers only the gaps that
// suite does not: controllers/bank.js#updateWithdraw's mass-assignment +
// state-transition fix, #deleteWithdraw's ownership fix, and
// routes/event.js's ticket-tier-stats auth fix.

let app: Express
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'

async function createTestUser(overrides: Record<string, unknown> = {}) {
  const salt = await bcrypt.genSalt(10)
  const password = await bcrypt.hash('TestPassword123!', salt)
  const user = new User({
    username: `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test User',
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`,
    password,
    isPartner: true,
    isAdmin: false,
    referralCode: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  })
  return await user.save()
}

async function createTestEvent(plannerId: string, overrides: Record<string, unknown> = {}) {
  const event = new Event({
    name: 'test event',
    planner_id: plannerId,
    planner: 'Test Organizer',
    category: 'music',
    description: 'a test event',
    address: 'test venue',
    state: 'lagos',
    ticketType: [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }],
    ...overrides,
  })
  return await event.save()
}

async function createTestWithdraw(userId: string, overrides: Record<string, unknown> = {}) {
  const withdraw = new Withdraw({
    user_id: userId,
    bankName: 'Test Bank',
    acctName: 'Test Organizer',
    acctNumber: '0123456789',
    eventName: 'test event',
    amount: 50000,
    status: 'pending',
    ...overrides,
  })
  return await withdraw.save()
}

function signToken(user: { _id: mongoose.Types.ObjectId | string }, overrides: Record<string, unknown> = {}) {
  return jwt.sign(
    {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: 'user@example.com',
      isPartner: true,
      isAdmin: false,
      ...overrides,
    },
    TEST_JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function signFinanceAdminToken(user: { _id: mongoose.Types.ObjectId | string }) {
  return signToken(user, { isAdmin: true, role: 'finance' })
}

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  await connectAmbientMemoryDb()

  app = express()
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
  app.use(cookieParser())
  app.use('/withdraw', withdrawRouter)
  app.use('/event', eventRouter)

  app.use((err: any, req: any, res: any, next: any) => {
    const status = err.status || err.statusCode || 500
    const message = err.message || 'Something went wrong'
    res.status(status).json({ success: false, message })
  })
}, 120_000)

afterAll(async () => {
  await disconnectAmbientMemoryDb()
}, 30_000)

beforeEach(async () => {
  await clearAmbientCollections()
})

describe('DELETE /withdraw/:id — ownership fix (Phase 12D)', () => {
  it('a different user cannot delete someone else\'s withdrawal', async () => {
    const owner = await createTestUser()
    const stranger = await createTestUser()
    const withdraw = await createTestWithdraw(owner._id.toString())

    const res = await request(app)
      .delete(`/withdraw/${withdraw._id.toString()}`)
      .set('Authorization', `Bearer ${signToken(stranger)}`)

    expect(res.status).toBe(403)
    expect(await Withdraw.findById(withdraw._id)).not.toBeNull()
  })

  it('the owner can delete their own withdrawal', async () => {
    const owner = await createTestUser()
    const withdraw = await createTestWithdraw(owner._id.toString())

    const res = await request(app)
      .delete(`/withdraw/${withdraw._id.toString()}`)
      .set('Authorization', `Bearer ${signToken(owner)}`)

    expect(res.status).toBe(200)
    expect(await Withdraw.findById(withdraw._id)).toBeNull()
  })
})

describe('PUT /withdraw/edit/:id — mass-assignment + state-transition fix (Phase 12D)', () => {
  it('a non-finance authenticated user (even the withdrawal\'s own owner) is forbidden outright', async () => {
    const owner = await createTestUser()
    const withdraw = await createTestWithdraw(owner._id.toString())

    const res = await request(app)
      .put(`/withdraw/edit/${withdraw._id.toString()}`)
      .set('Authorization', `Bearer ${signToken(owner)}`)
      .send({ status: 'approved' })

    expect(res.status).toBe(403)
  })

  it('a finance admin cannot mutate fields outside the status/rejectionReason allowlist', async () => {
    const owner = await createTestUser()
    const withdraw = await createTestWithdraw(owner._id.toString())
    const financeAdmin = await createTestUser({ isAdmin: true })

    const res = await request(app)
      .put(`/withdraw/edit/${withdraw._id.toString()}`)
      .set('Authorization', `Bearer ${signFinanceAdminToken(financeAdmin)}`)
      .send({ status: 'approved', amount: 999999999, acctNumber: '9999999999' })

    expect(res.status).toBe(400)
    const unchanged = await Withdraw.findById(withdraw._id)
    expect(unchanged?.amount).toBe(50000)
    expect(unchanged?.acctNumber).toBe('0123456789')
  })

  it('an invalid state transition (processing -> approved) is rejected', async () => {
    const owner = await createTestUser()
    const withdraw = await createTestWithdraw(owner._id.toString(), { status: 'processing', transferCode: 'TRF_x' })
    const financeAdmin = await createTestUser({ isAdmin: true })

    const res = await request(app)
      .put(`/withdraw/edit/${withdraw._id.toString()}`)
      .set('Authorization', `Bearer ${signFinanceAdminToken(financeAdmin)}`)
      .send({ status: 'approved' })

    expect(res.status).toBe(409)
    expect((await Withdraw.findById(withdraw._id))?.status).toBe('processing')
  })

  it('a legal transition (pending -> approved) by a finance admin succeeds', async () => {
    const owner = await createTestUser()
    const withdraw = await createTestWithdraw(owner._id.toString(), { status: 'pending' })
    const financeAdmin = await createTestUser({ isAdmin: true })

    const res = await request(app)
      .put(`/withdraw/edit/${withdraw._id.toString()}`)
      .set('Authorization', `Bearer ${signFinanceAdminToken(financeAdmin)}`)
      .send({ status: 'approved' })

    expect(res.status).toBe(200)
    expect((await Withdraw.findById(withdraw._id))?.status).toBe('approved')
  })
})

describe('GET /event/:id/tiers/stats — authorization required (Phase 12D)', () => {
  it('an anonymous caller is rejected', async () => {
    const owner = await createTestUser()
    const event = await createTestEvent(owner._id.toString())

    const res = await request(app).get(`/event/${event._id.toString()}/tiers/stats`)

    expect(res.status).toBe(401)
  })

  it('an authenticated caller is accepted', async () => {
    const owner = await createTestUser()
    const event = await createTestEvent(owner._id.toString())

    const res = await request(app)
      .get(`/event/${event._id.toString()}/tiers/stats`)
      .set('Authorization', `Bearer ${signToken(owner)}`)

    expect(res.status).not.toBe(401)
  })
})
