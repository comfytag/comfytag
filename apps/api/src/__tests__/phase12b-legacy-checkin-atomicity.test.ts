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
import Audience from '../../models/Audience'
import audienceRouter from '../../routes/audience.js'

// ============================================================================
// Phase 12B — legacy ticket check-in atomicity regression tests
// ============================================================================
//
// The Phase 12A audit found controllers/audience.js#checkInByReference and
// #manualCheckIn both used a read-then-`.save()` pattern with no atomic
// guard — two near-simultaneous scans/toggles of the same ticket could both
// succeed, double-counting attendance at the door. Both now perform the
// actual transition as a single atomic findOneAndUpdate guarded on the
// ticket's current checkedIn value.

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

async function createTestTicket(eventId: string, overrides: Record<string, unknown> = {}) {
  const ticket = new Audience({
    name: 'Attendee',
    email: 'attendee@example.com',
    event_id: eventId,
    user_id: 'guest',
    eventname: 'test event',
    amount: 1000,
    numOfTicket: 1,
    reference: `REF_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
    type: 'regular',
    status: 'active',
    checkedIn: false,
    ...overrides,
  })
  return await ticket.save()
}

function signPartnerToken(userId: string | mongoose.Types.ObjectId) {
  return jwt.sign(
    { id: userId.toString(), _id: userId.toString(), email: 'organizer@example.com', isPartner: true, isAdmin: false },
    TEST_JWT_SECRET,
    { expiresIn: '7d' }
  )
}

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  await connectAmbientMemoryDb()

  app = express()
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
  app.use(cookieParser())
  app.use('/audience', audienceRouter)

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

describe('POST /audience/checkin-by-ref — QR check-in atomicity (Phase 12B)', () => {
  it('checks in an eligible ticket', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString())
    const ticket = await createTestTicket(event._id.toString())

    const res = await request(app)
      .post('/audience/checkin-by-ref')
      .set('Authorization', `Bearer ${signPartnerToken(organizer._id)}`)
      .send({ reference: ticket.reference })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const updated = await Audience.findById(ticket._id)
    expect(updated?.checkedIn).toBe(true)
    expect(updated?.status).toBe('used')
  })

  it('two simultaneous scans of the same ticket: exactly one succeeds', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString())
    const ticket = await createTestTicket(event._id.toString())
    const token = signPartnerToken(organizer._id)

    const [res1, res2] = await Promise.all([
      request(app).post('/audience/checkin-by-ref').set('Authorization', `Bearer ${token}`).send({ reference: ticket.reference }),
      request(app).post('/audience/checkin-by-ref').set('Authorization', `Bearer ${token}`).send({ reference: ticket.reference }),
    ])

    const successes = [res1, res2].filter(r => r.body.success === true)
    const alreadyCheckedIn = [res1, res2].filter(r => r.body.alreadyCheckedIn === true)
    expect(successes).toHaveLength(1)
    expect(alreadyCheckedIn).toHaveLength(1)

    const updated = await Audience.findById(ticket._id)
    expect(updated?.checkedIn).toBe(true)
  })

  it('a second scan of an already-checked-in ticket returns alreadyCheckedIn, not a fresh success', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString())
    const ticket = await createTestTicket(event._id.toString(), {
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInMethod: 'qr',
      status: 'used',
    })

    const res = await request(app)
      .post('/audience/checkin-by-ref')
      .set('Authorization', `Bearer ${signPartnerToken(organizer._id)}`)
      .send({ reference: ticket.reference })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(false)
    expect(res.body.alreadyCheckedIn).toBe(true)
  })
})

describe('POST /audience/:id/checkin — manual check-in atomicity (Phase 12B)', () => {
  it('checks in an eligible ticket', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString())
    const ticket = await createTestTicket(event._id.toString())

    const res = await request(app)
      .post(`/audience/${ticket._id.toString()}/checkin`)
      .set('Authorization', `Bearer ${signPartnerToken(organizer._id)}`)
      .send({ checkedIn: true })

    expect(res.status).toBe(200)
    expect(res.body.ticket.checkedIn).toBe(true)
  })

  it('two simultaneous check-in toggles on the same ticket: exactly one succeeds, one gets a 409', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString())
    const ticket = await createTestTicket(event._id.toString())
    const token = signPartnerToken(organizer._id)

    const [res1, res2] = await Promise.all([
      request(app).post(`/audience/${ticket._id.toString()}/checkin`).set('Authorization', `Bearer ${token}`).send({ checkedIn: true }),
      request(app).post(`/audience/${ticket._id.toString()}/checkin`).set('Authorization', `Bearer ${token}`).send({ checkedIn: true }),
    ])

    const statuses = [res1.status, res2.status].sort()
    expect(statuses).toEqual([200, 409])
    expect((await Audience.findById(ticket._id))?.checkedIn).toBe(true)
  })

  it('toggling an already-checked-in ticket to checked-in again returns 409', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString())
    const ticket = await createTestTicket(event._id.toString(), { checkedIn: true, checkedInAt: new Date(), checkedInMethod: 'manual' })

    const res = await request(app)
      .post(`/audience/${ticket._id.toString()}/checkin`)
      .set('Authorization', `Bearer ${signPartnerToken(organizer._id)}`)
      .send({ checkedIn: true })

    expect(res.status).toBe(409)
  })

  it('reversing a check-in on a not-checked-in ticket returns 409', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString())
    const ticket = await createTestTicket(event._id.toString(), { checkedIn: false })

    const res = await request(app)
      .post(`/audience/${ticket._id.toString()}/checkin`)
      .set('Authorization', `Bearer ${signPartnerToken(organizer._id)}`)
      .send({ checkedIn: false })

    expect(res.status).toBe(409)
  })

  it('a non-owning organizer cannot check in a ticket for someone else\'s event', async () => {
    const owner = await createTestUser()
    const stranger = await createTestUser()
    const event = await createTestEvent(owner._id.toString())
    const ticket = await createTestTicket(event._id.toString())

    const res = await request(app)
      .post(`/audience/${ticket._id.toString()}/checkin`)
      .set('Authorization', `Bearer ${signPartnerToken(stranger._id)}`)
      .send({ checkedIn: true })

    expect(res.status).toBe(403)
    expect((await Audience.findById(ticket._id))?.checkedIn).toBe(false)
  })
})
