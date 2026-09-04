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
import eventRouter from '../../routes/event.js'

// ============================================================================
// Phase 12B — legacy event lifecycle transition guard regression tests
// ============================================================================
//
// The Phase 12A audit found controllers/event.js#updateEvent accepted an
// arbitrary client-supplied `status` via a generic PATCH with no transition
// guard, and #publishEvent/#cancelEvent set their target status
// unconditionally regardless of the event's current status — a
// cancelled/ended event could be silently resurrected to 'published'. All
// three now validate the transition against an explicit lifecycle map
// (draft -> published|cancelled, published -> ended|cancelled, both
// 'ended' and 'cancelled' terminal) before applying it, atomically guarded
// against the status the check was made against.

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
    status: 'draft',
    ticketType: [{ name: 'regular', price: 1000, capacity: 100, sold: 0 }],
    ...overrides,
  })
  return await event.save()
}

function signOrganizerToken(userId: string | mongoose.Types.ObjectId) {
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
  app.use('/events', eventRouter)

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

describe('POST /events/:id/publish (Phase 12B)', () => {
  it('draft -> published succeeds', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'draft' })

    const res = await request(app)
      .post(`/events/${event._id.toString()}/publish`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('published')
  })

  it('published -> published is a harmless no-op', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'published' })

    const res = await request(app)
      .post(`/events/${event._id.toString()}/publish`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('published')
  })

  it('cancelled -> published is rejected (cannot resurrect a cancelled event)', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'cancelled' })

    const res = await request(app)
      .post(`/events/${event._id.toString()}/publish`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)

    expect(res.status).toBe(409)
    expect((await Event.findById(event._id))?.status).toBe('cancelled')
  })

  it('ended -> published is rejected (cannot resurrect an ended event)', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'ended' })

    const res = await request(app)
      .post(`/events/${event._id.toString()}/publish`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)

    expect(res.status).toBe(409)
    expect((await Event.findById(event._id))?.status).toBe('ended')
  })
})

describe('POST /events/:id/cancel (Phase 12B)', () => {
  it('draft -> cancelled succeeds', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'draft' })

    const res = await request(app)
      .post(`/events/${event._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('cancelled')
  })

  it('published -> cancelled succeeds', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'published' })

    const res = await request(app)
      .post(`/events/${event._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('cancelled')
  })

  it('ended -> cancelled is rejected (cannot retroactively cancel an ended event)', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'ended' })

    const res = await request(app)
      .post(`/events/${event._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)

    expect(res.status).toBe(409)
    expect((await Event.findById(event._id))?.status).toBe('ended')
  })

  it('cancelled -> cancelled is a harmless no-op', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'cancelled' })

    const res = await request(app)
      .post(`/events/${event._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('cancelled')
  })
})

describe('PATCH /events/:id — generic status transition guard (Phase 12B)', () => {
  it('rejects an arbitrary/unknown status value', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'draft' })

    const res = await request(app)
      .patch(`/events/${event._id.toString()}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ status: 'totally-made-up-status' })

    expect(res.status).toBe(400)
    expect((await Event.findById(event._id))?.status).toBe('draft')
  })

  it('rejects draft -> ended (must go through published first)', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'draft' })

    const res = await request(app)
      .patch(`/events/${event._id.toString()}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ status: 'ended' })

    expect(res.status).toBe(409)
    expect((await Event.findById(event._id))?.status).toBe('draft')
  })

  it('allows published -> ended', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'published' })

    const res = await request(app)
      .patch(`/events/${event._id.toString()}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ status: 'ended' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ended')
  })

  it('rejects cancelled -> published via generic PATCH too, not just the dedicated endpoint', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'cancelled' })

    const res = await request(app)
      .patch(`/events/${event._id.toString()}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ status: 'published' })

    expect(res.status).toBe(409)
    expect((await Event.findById(event._id))?.status).toBe('cancelled')
  })

  it('a PATCH that does not touch status still updates other fields normally', async () => {
    const organizer = await createTestUser()
    const event = await createTestEvent(organizer._id.toString(), { status: 'draft' })

    const res = await request(app)
      .patch(`/events/${event._id.toString()}`)
      .set('Authorization', `Bearer ${signOrganizerToken(organizer._id)}`)
      .send({ headline: 'Updated headline' })

    expect(res.status).toBe(200)
    expect(res.body.headline).toBe('Updated headline')
    expect((await Event.findById(event._id))?.status).toBe('draft')
  })
})
