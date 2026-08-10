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
import Event from '../../models/Event'
import Audience from '../../models/Audience'
import Referral from '../../models/Referral'
import Wallet from '../../models/Wallet'

import referralRouter from '../../routes/referral'

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
    isPartner: false,
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

async function createTestEvent(plannerUserId: string, overrides = {}) {
  const event = new Event({
    name: `Test Event ${Date.now()}`,
    planner_id: plannerUserId.toString(),
    planner: 'Test Planner',
    category: 'music',
    description: 'Test event',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    address: 'Test Address',
    state: 'Lagos',
    venue: 'Test Venue',
    ticketType: [
      {
        name: 'General',
        price: 1000,
        capacity: 10,
        sold: 0,
      }
    ],
    status: 'published',
    ...overrides,
  })

  return await event.save()
}

async function createTestTicket(userId: string, eventId: string) {
  const event = await Event.findById(eventId)
  const ticket = new Audience({
    user_id: userId.toString(),
    event_id: eventId.toString(),
    name: 'Test Attendee',
    email: `attendee_${Date.now()}@example.com`,
    phone: 2348012345670 + Math.random() * 100,
    eventname: event?.name || 'Test Event',
    type: 'General',
    amount: 1000,
    numOfTicket: 1,
    status: 'active',
    reference: `REF${Date.now()}`,
    totpSecret: 'test-secret',
    qrCode: 'data:image/png;base64,test',
    faceOwner: userId.toString(),
  })

  return await ticket.save()
}

async function createTestReferral(referrerId: string, eventId: string, overrides = {}) {
  const referral = new Referral({
    referrer_id: referrerId.toString(),
    event_id: eventId.toString(),
    code: `REFCODE${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    ...overrides,
  })

  return await referral.save()
}

function signTestToken(userId: string | mongoose.Types.ObjectId, isPartner = false, isAdmin = false) {
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

  app.use('/referral', referralRouter)

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
// FIX 4 — referral idempotency
// ============================================================================

describe('POST /referral/apply', () => {
  it('credits the referrer wallet on the first call', async () => {
    const referrer = await createTestUser({ name: 'Referrer' })
    const buyer = await createTestUser({ name: 'Buyer' })
    const event = await createTestEvent(referrer._id.toString())
    const ticket = await createTestTicket(buyer._id.toString(), event._id.toString())
    const referral = await createTestReferral(referrer._id.toString(), event._id.toString())

    const res = await request(app)
      .post('/referral/apply')
      .set('Authorization', `Bearer ${signTestToken(buyer._id)}`)
      .send({ code: referral.code, ticketId: ticket._id.toString() })

    expect(res.status).toBe(200)
    expect(res.body.credited).toBe(true)

    const wallet = await Wallet.findOne({ user_id: referrer._id.toString() })
    expect(wallet?.balance).toBe(500)

    const updatedReferral = await Referral.findById(referral._id)
    expect(updatedReferral?.conversions).toBe(1)
    expect(updatedReferral?.total_credited).toBe(500)

    const updatedTicket = await Audience.findById(ticket._id)
    expect(updatedTicket?.referralRedeemed).toBe(true)
  })

  it('does not credit the wallet again on a repeated call for the same ticket', async () => {
    const referrer = await createTestUser({ name: 'Referrer' })
    const buyer = await createTestUser({ name: 'Buyer' })
    const event = await createTestEvent(referrer._id.toString())
    const ticket = await createTestTicket(buyer._id.toString(), event._id.toString())
    const referral = await createTestReferral(referrer._id.toString(), event._id.toString())

    const token = signTestToken(buyer._id)
    const body = { code: referral.code, ticketId: ticket._id.toString() }

    const first = await request(app)
      .post('/referral/apply')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
    expect(first.status).toBe(200)
    expect(first.body.credited).toBe(true)

    const second = await request(app)
      .post('/referral/apply')
      .set('Authorization', `Bearer ${token}`)
      .send(body)

    expect(second.status).toBe(200)
    expect(second.body.credited).toBe(false)
    expect(second.body.reason).toBe('already-redeemed')

    const wallet = await Wallet.findOne({ user_id: referrer._id.toString() })
    expect(wallet?.balance).toBe(500)

    const updatedReferral = await Referral.findById(referral._id)
    expect(updatedReferral?.conversions).toBe(1)
    expect(updatedReferral?.total_credited).toBe(500)
  })
})
